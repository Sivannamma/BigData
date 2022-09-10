const Kafka = require("node-rdkafka");
const flightType = require("./flightSerialize")
const config = require("./Models/config");
const express = require('express');
const app = express();
const axios = require("axios");
var MongoClient = require('mongodb').MongoClient
const fs = require("fs");
const { Int32 } = require("mongodb");
var url = "mongodb://localhost:27017/";
const bigml = require('bigml');


var range = null


const Days = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
}

const port = 4000;


app.listen(port, () => {
    console.log("Listening on port " + port);


    // DELETE FROM MONGO
    // MongoClient.connect(url, function (err, db) {
    //     if (err) throw err;
    //     var dbo = db.db("FlightsAI");
    //     dbo.collection("ArrivalPrediction").drop(function (err, delOK) {
    //         if (err) throw err;
    //         if (delOK) console.log("Collection deleted");
    //         db.close();
    //     });
    // });


    // CREATE MONGO COLLECTION
    // MongoClient.connect(url, function (err, db) {
    //     if (err) throw err;
    //     var dbo = db.db("FlightsAI");
    //     dbo.createCollection("ArrivalPrediction", function (err, res) {
    //         if (err) throw err;
    //         console.log("Collection created!");
    //         db.close();
    //     });
    // });





});



const historicalArrivalConsumer = Kafka.KafkaConsumer({
    // parameter 1 -group id and broker
    // parameter 2 - options

    'group.id': 'kafka',
    'metadata.broker.list': 'localhost:9092'
}, {});

const historicalDepartureConsumer = Kafka.KafkaConsumer({
    // parameter 1 -group id and broker
    // parameter 2 - options

    'group.id': 'kafka',
    'metadata.broker.list': 'localhost:9092'
}, {});




historicalArrivalConsumer.connect();
historicalDepartureConsumer.connect();



historicalArrivalConsumer.on('ready', () => {
    console.log("Hisotrical Arrival Consumer is ready");

    // we need to fetch events from topic
    // array of topics , filter by topic name
    historicalArrivalConsumer.subscribe(['historicalArrivalTopic']);
    historicalArrivalConsumer.consume();

    // any new data comes in
}).on('data', async (data) => {

    try {
        let hisotricalArrivalObj = flightType.fromBuffer(data.value);

        //console.log(hisotricalArrivalObj
        if (hisotricalArrivalObj !== null && hisotricalArrivalObj !== undefined)
            await retreiveDetails(hisotricalArrivalObj, true)

    }

    catch (err) {
        console.log("Failed to extract Arrival flightAI details");
    }






})





historicalDepartureConsumer.on('ready', () => {
    console.log("Hisotrical Departure Consumer is ready");

    // we need to fetch events from topic
    // array of topics , filter by topic name
    historicalDepartureConsumer.subscribe(['historicalDepartureTopic']);
    historicalDepartureConsumer.consume();

    // any new data comes in
}).on('data', async (data) => {

    try {
        let hisotricalDepartureObj = flightType.fromBuffer(data.value);

        //console.log(hisotricalArrivalObj
        if (hisotricalDepartureObj !== null && hisotricalDepartureObj !== undefined)
            await retreiveDetails(hisotricalDepartureObj, false)

    }

    catch (err) {
        console.log("Failed to extract Departure flightAI details");
    }






})



const retreiveDetails = async (flight, isArrival) => {



    try {

        if (flight.source !== null && flight.source !== undefined) {
            let coordinates = await getCountryCoordinates(flight.source)

            if (coordinates !== "undefined#undefined") {


                //console.log("coordinates are " + coordinates);
                let lat_lan = coordinates.split("#")



                let temp = await getCountryWeather(lat_lan[0], lat_lan[1])
                temp = (5 / 9) * (temp - 32)

                //console.log("Temp is " + temp);

                let contriesRange = await countriesAirRange(lat_lan[0], lat_lan[1])
                console.log("Range is " + range);

                flight.range = range
                flight.weatherAi = temp;


                //console.log(flight);




                MongoClient.connect(url, function (err, db) {
                    if (err) throw err;
                    var dbo = db.db("FlightsAI");
                    dbo.collection("ArrivalPrediction").insertOne(flight, function (err, res) {
                        if (err) throw err;
                        console.log("1 document inserted to mongoDB");
                        db.close();
                    });

                });
                const israelLat = 32.109333;
                const israelLon = 34.855499
                var israelWeather = await getCountryWeather(israelLat, israelLon)
                israelWeather = (5 / 9) * (israelWeather - 32)
                // var csv = "typeOfDay,Month,Day,Airline,source,destination,typeOfFlight,sourceWeather,destinationWeather";



                var day = Days[new Date(flight.flight_date).getDay()];
                var month = flight.flight_date.split("-")[1];
                var sourceCountry = isArrival ? flight.source : 'Israel'
                var desCountry = isArrival ? 'Israel' : flight.source
                var typeOfFlight = flight.range <= 1500 ? "Short" : flight.range <= 3500 ? "Medium" : "Long"
                var weatherSource = isArrival ? flight.weatherAi : israelWeather
                var weatherDes = isArrival ? israelWeather : flight.weatherAi
                var arrivalDelay = flight.arrival_delay === "null" ? 0 : flight.arrival_delay
                var departureDelay = flight.departure_delay === "null" ? 0 : flight.departure_delay

                // insert to csv
                csv = `\r\n ${flight.typeOfDay},${month},${day},${flight.airline},${sourceCountry},${desCountry},${typeOfFlight},${weatherSource},${weatherDes},${parseInt(arrivalDelay) + parseInt(departureDelay)}`;
                fs.appendFileSync("training_data_set.csv", csv);
                console.log("Inserted to csv");
            }
        }
    }
    catch (err) {
        console.log("Failed in retreiveDetails : " + err);
    }



}







const getCountryWeather = async (lat, lon) => {


    try {
        const countryWeather = await axios.get(
            config.weatherApiAI(lat, lon, "MPYDSMMUJFFD2WQYCFBFZUVDW")

        );

        const values = Object.values(countryWeather.data.days);
        const temp = values[0].temp;

        return temp;



    }
    catch (err) {
        console.log(`Failed to fetch weather ai , err : ${err}`);
    }

}





const getCountryCoordinates = async (cityName) => {


    try {
        const countryCoordinates = await axios.get(
            config.countryCoordinatesByCityNameApi(cityName, "bf868a25da224210fc4c86d76fbd4a0d")

        );

        const values = Object.values(countryCoordinates.data.data);
        const lat = values[0].latitude;
        const lon = values[0].longitude;

        return String(lat + "#" + lon)


    }
    catch (err) {
        console.log(`Failed to fetch country coordinates , err : ${err}`);
    }

}




var rad = function (x) {
    return x * Math.PI / 180;
};



var getDistance = function (p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat - p1.lat);
    var dLong = rad(p2.lng - p1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d / 1000; // returns the distance in meter
};


const countriesAirRange = async (lat, lon) => {
    const israelLat = 32.066455;
    const israelLon = 34.783553

    let p1 = { lat: israelLat, lng: israelLon };
    let p2 = { lat: lat, lng: lon };
    try {
        var res = getDistance(p1, p2)
        range = parseInt(res);
    }
    catch (e) {
        console.log(e);
    }


}

const createBigMlConnection = () => {

    try {

        //elad11310
        var connection = new bigml.BigML('elad11310', '0a1a52cc11b3500869ce10e800250441564be462')



        var pred;
        var connection2;
        var myModelInfo;

        var source = new bigml.Source(connection);

        source.create('./demoA.csv', function (error, sourceInfo) {
            if (!error && sourceInfo) {
                var dataset = new bigml.Dataset();
                console.log(sourceInfo);
                //source/631b8858d432eb0e2b0013d2'
                dataset.create(sourceInfo, function (error, datasetInfo) {
                    if (!error && datasetInfo) {
                        var model = new bigml.Model();
                        model.create(datasetInfo, function (error, modelInfo) {
                            if (!error && modelInfo) {
                                var prediction = new bigml.Prediction();
                                connection2 = connection
                                prediction.create(modelInfo, { "": "" })
                                myModelInfo = modelInfo
                                pred = prediction
                            }
                            else {
                                console.log("2");
                            }
                        });
                    }
                    else {
                        console.log("1" + error);
                    }
                });

                console.log("Logged in....");
            }
            else {
                console.log("faileddd" + error);
            }
        });


    }
    catch (err) {
        console.log("Failed to connect to bigml" + err);
    }

}



