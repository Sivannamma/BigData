const Kafka = require("node-rdkafka");
const express = require("express");


//const bodyParser = require("body-parser");


const config = require("./Models/config");
const axios = require("axios");
const Weather = require("./Models/weather");
const Flight = require("./Models/flight");

// serialize objects to kafka streamer
const flightType = require("./flightSerialize")
const weatherType = require("./weatherSerialize");

// reading/writing files
const fs = require("fs");


var holydayDates = []

const hours = 2
const seconds = 30


// connection to mySql
const connection = config.connection;

// arrays to pass to kafka
let historicalDeparturesArr = [];
let historicalArrivalsArr = [];
let arrivalsArr = [];
let departuresArr = [];
let weatherArr = [];
// first run
var first = true
var firstHistory = true

const app = express();

//app.use(bodyParser.urlencoded({ extended: false }));

const port = 2356;
app.listen(port, async () => {
  console.log("Listening on port " + port);

  // getHolidayDates(async (cb) => {
  //   await getHistoricalFlights("arr_iata", true);
  //   await getHistoricalFlights("dep_iata", false);
  // });



  await getApiData();

});



const getHolidayDates = (cb) => {



  fs.readFile('holidays.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }


    data.split(/\r?\n/).forEach(line => {
      //console.log(`Line from file: ${String(line)}`);

      holydayDates.push(line)

      // console.log(order);

    });

    cb(holydayDates)


  })
}
const createArrivalStream = Kafka.Producer.createWriteStream({
  // [arameter 1 - creating the broker to connect to
  // parameter 2 - options
  // parameter 3 - topic
  'metadata.broker.list': 'localhost:9092'
}, {}, { topic: 'test' });

const createDepartureStream = Kafka.Producer.createWriteStream({
  // [arameter 1 - creating the broker to connect to
  // parameter 2 - options
  // parameter 3 - topic
  'metadata.broker.list': 'localhost:9092'
}, {}, { topic: 'departureTopic' });



const createHistoricalDepartureStream = Kafka.Producer.createWriteStream({
  // [arameter 1 - creating the broker to connect to
  // parameter 2 - options
  // parameter 3 - topic
  'metadata.broker.list': 'localhost:9092'
}, {}, { topic: 'historicalDepartureTopic' });


const createHistoricalArrivalStream = Kafka.Producer.createWriteStream({
  // [arameter 1 - creating the broker to connect to
  // parameter 2 - options
  // parameter 3 - topic
  'metadata.broker.list': 'localhost:9092'
}, {}, { topic: 'historicalArrivalTopic' });

const createWeatherStream = Kafka.Producer.createWriteStream({
  // [arameter 1 - creating the broker to connect to
  // parameter 2 - options
  // parameter 3 - topic
  'metadata.broker.list': 'localhost:9092'
}, {}, { topic: 'weathereTopic' });



const createFinishStream = Kafka.Producer.createWriteStream({
  // [arameter 1 - creating the broker to connect to
  // parameter 2 - options
  // parameter 3 - topic
  'metadata.broker.list': 'localhost:9092'
}, {}, { topic: 'Finish' });




const writeToStram = (arrToStream, typeToSerialize, stream) => {
  // publishing events to the topic in the kafka
  let i = 0;


  arrToStream.forEach(element => {
    // toBuffer is an avsc stream objects to broker
    try {


      const response = stream.write(typeToSerialize.toBuffer(element));
      if (response) {
        console.log(`Message has been wrote successfully to the stream on first try `);
        //i++;
      }
      else {
        console.log("There was a problem writing to the stream... trying again...");
        const retryResponse = stream.write(typeToSerialize.toBuffer(element));
        if (retryResponse) {
          console.log("Message has been wrote successfully to the stream on second try");
          // i++;
        }
        else {
          console.log("There was a problem writing to the stream...Second time failure...data is missing");
        }
      }



    }

    catch (err) {
      console.log(`There was a problem writing to the stream... err is ${err}`);
    }


  });


}

//set interval to write to that stream

setInterval(async () => {

  if (!first) {
    await getApiData();
  }
  else {
    first = false;
  }


  console.log("Going to write arrays to stream....");
  if (weatherArr.length > 0) {
    writeToStram(weatherArr, weatherType, createWeatherStream);
    weatherArr = []
  }


  if (arrivalsArr.length > 0) {
    writeToStram(arrivalsArr, flightType, createArrivalStream);
    arrivalsArr = []
  }



  if (departuresArr.length > 0) {
    writeToStram(departuresArr, flightType, createDepartureStream);
    departuresArr = []

  }




}, 1000 * seconds)


setInterval(async () => {

  if (!firstHistory) {
    getHolidayDates(async (cb) => {
      await getHistoricalFlights("arr_iata", true);
      await getHistoricalFlights("dep_iata", false);
    });

  }
  else {
    firstHistory = false;
  }


  if (historicalArrivalsArr.length > 0) {
    //console.log(" historicalArrivalsArr ARRAY size " + historicalArrivalsArr.length);
    writeToStram(historicalArrivalsArr, flightType, createHistoricalArrivalStream);
    historicalArrivalsArr = []
  }

  if (historicalDeparturesArr.length > 0) {
    // console.log(" historicalDeparturesArr ARRAY size " + historicalDeparturesArr.length);
    writeToStram(historicalDeparturesArr, flightType, createHistoricalDepartureStream);
    historicalArrivalsArr = []
  }




}, 3600000 * hours)


//3600000



const getApiData = async () => {

  try {

    await getWeather();


    await getFlights("arr_iata", true);
    //await sleep(2000);
    await getFlights("dep_iata", false);

    console.log(
      `We have ${arrivalsArr.length} arrivals flights and ${departuresArr.length} departures...`
    );



  } catch (err) {
    console.log(`Error when trying to fetch data from api: ${err}`);
  }
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};


const getHolydays = async (date) => {

  var res = false
  let d = date.split("-")
  let dateStr = `${d[0]}-${d[1]}-${d[2]}`

  let holyday;
  try {
    holyday = await axios.get(config.holydaysApi(dateStr));

    let hebDate = Object.values(holyday.data.heDateParts);

    let splitDate = String(hebDate).split(",");

    hebDate = splitDate[1] + " " + splitDate[2]


    let s = splitDate[2].length == 2 ? splitDate[2][0] : splitDate[2][0] + splitDate[2][2]
    hebDate = s + " " + splitDate[1]
    let collator = new Intl.Collator('he');
    holydayDates.forEach(element => {

      let order = collator.compare(element, String(hebDate));
      // console.log(order);
      if (order === 0) {

        res = true;


      }

    });


    WriteToDb("Holiday");
    console.log("1 row inserted in Holyday categoery.");
    return res;

  } catch (err) {
    console.log(
      `Error when trying to fetch data from Holyday api : ${err.message}`
    );
  }

  return holyday;
};


const getWeather = async () => {
  const kelvinToCelcuies = 272.15;
  let weather;

  try {
    weather = await axios.get(
      config.weatherApi("d9bfd2bfc72f9d427028431200e440b6", 32.109333, 34.855499)
    );

    const descriptions = Object.values(weather.data.weather);
    const main = weather.data.main;

    let description = descriptions[0].description;

    let temp = (main.temp - kelvinToCelcuies).toFixed(1);

    let feels_like = (main.feels_like - kelvinToCelcuies).toFixed(1);
    let humidity = main.humidity;

    let weatherObj = new Weather(String(description), String(temp), String(feels_like), String(humidity));

    console.log(weatherObj.description, weatherObj.temp, weatherObj.feels_like, weatherObj.humidity);

    weatherArr.push(weatherObj)
    WriteToDb("Weather");

    console.log("1 row inserted in Weather categoery.");
  } catch (err) {
    console.log(
      `Error when trying to fetch data from Weather api : ${err.message}`
    );
  }
};

const getFlights = async (code, isArrival) => {
  try {
    const flightType = await axios.get(
      config.flghtsApi(code, "tlv", "80523945dad0cd6e5e646c5b86f544cc", 50)



    );

    const values = Object.values(flightType.data.data);

    values.forEach(async (element) => {


      let deprature = element.departure;
      let arrival = element.arrival;
      let flight = element.flight;
      let live = element.live;
      let airline = element.airline;



      let source;
      let destination;
      if (isArrival === true) {
        source = deprature.timezone;
        destination = arrival.timezone
      }
      else {
        source = arrival.timezone
        destination = deprature.timezone;
      }
      var src = String(source).split("/")[1];
      var des = String(destination).split("/")[1];


      // check if the flight date is holyday or summer holyday or nirmal day.
      var typeOfDay = ""
      if (String(element.flight_date).includes("-08-") || String(element.flight_date).includes("-07-")) {
        typeOfDay = "Summer holiday"
      }
      else {
        // check israel holyday
        var res = await getHolydays(String(element.flight_date))
        if (res) {
          typeOfDay = "Holiday"
        }
        else {
          typeOfDay = "Normal day"
        }
      }

      let flightNew = new Flight(
        String(flight.number),
        String(element.flight_date),
        String(element.flight_status),
        String(deprature.airport),
        String(deprature.delay),
        String(deprature.scheduled),
        String(deprature.estimated),
        String(deprature.actual),

        String(arrival.airport),
        //arrival.delay === "null" ? 0 : arrival.delay,
        String(arrival.scheduled),
        String(arrival.estimated),
        String(arrival.actual),
        String(arrival.delay),
        String(flight.live),
        String(live === null ? "null" : live.latitude),
        String(live === null ? "null" : live.longitude),
        String(airline.name),
        String(src),
        String(des),
        String(typeOfDay),
        String(isArrival ? "Arrival" : "Departure")
      );




      if (code == "arr_iata") {
        arrivalsArr.push(flightNew);
      } else {
        departuresArr.push(flightNew);
      }
    });
    WriteToDb(code == "arr_iata" ? "Flights_Arrival" : "Flights_Departure");
    console.log(`1 row inserted in ${code} categoery.`);

    return flightType;
  } catch (err) {
    console.log(
      `Error when trying to fetch data from ${code} api : ${err.message}`
    );
  }
};

const getHistoricalFlights = async (code, isArrival) => {
  try {
    const flightType = await axios.get(
      config.historicalFlghtsApi(code, "tlv", "80523945dad0cd6e5e646c5b86f544cc", 'landed', 50)



    );

    const values = Object.values(flightType.data.data);

    values.forEach(async (element) => {


      let deprature = element.departure;
      let arrival = element.arrival;
      let flight = element.flight;
      let live = element.live;
      let airline = element.airline;


      /// to know if to calcualte range between israel -> some country or some contry -> israel
      let source;
      let destination;
      if (isArrival === true) {
        source = deprature.timezone;
        destination = arrival.timezone
      }
      else {
        source = arrival.timezone
        destination = deprature.timezone;
      }
      var src = String(source).split("/")[1];
      var des = String(destination).split("/")[1];


      // check if the flight date is holyday or summer holyday or nirmal day.
      var typeOfDay = ""

      if (String(element.flight_date).includes("-08-") || String(element.flight_date).includes("-07-")) {

        typeOfDay = "Summer holiday"
      }
      else {
        // check israel holyday
        var res = await getHolydays(String(element.flight_date))
        // var res = await getHolydays("2022-08-01")
        //console.log("ELAD " + res);
        if (res) {
          typeOfDay = "Holiday"
        }
        else {
          typeOfDay = "Normal day"
        }
      }


      let flightNew = new Flight(
        String(flight.number),
        String(element.flight_date),
        String(element.flight_status),
        String(deprature.airport),
        String(deprature.delay),
        String(deprature.scheduled),
        String(deprature.estimated),
        String(deprature.actual),

        String(arrival.airport),
        String(arrival.scheduled),
        String(arrival.estimated),
        String(arrival.actual),
        String(arrival.delay),
        String(flight.live),
        String(live === null ? "null" : live.latitude),
        String(live === null ? "null" : live.longitude),
        String(airline.name),
        String(src),
        String(des),
        String(typeOfDay),
        String(isArrival ? "Arrival" : "Departure")
      );

      if (code == "arr_iata") {
        historicalArrivalsArr.push(flightNew);
      } else {
        historicalDeparturesArr.push(flightNew);
      }
    });
    WriteToDb(code == "arr_iata" ? "Historical Flights_Arrivals" : " Historical Flights_Departures");
    console.log(`1 row inserted in ${code} historical categoery.`);

    return flightType;
  } catch (err) {
    console.log(
      `Error when trying to fetch data from ${code} historical api : ${err.message}`
    );
  }

  console.log(
    `We have ${historicalArrivalsArr.length} historical arrivals flights`);

};

const WriteToDb = (category) => {
  try {
    const d = new Date();
    let date = d.toString();
    date = date.substring(0, date.indexOf("G"));
    console.log(date);
    var sql = `INSERT INTO apicalls (Category, Date) VALUES ('${category}', '${date}')`;
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Succeeded inserting 1 record to DB");
    });
  } catch {
    console.log("Error when trying to write to DB");
    throw err;
  }
};
