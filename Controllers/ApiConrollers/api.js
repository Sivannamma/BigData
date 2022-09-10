//const axios = require("axios");
const { json } = require("express");

const config = require("../../Models/config");
const axios = require("axios");
const Weather = require("../../Models/weather");
const Flight = require("../../Models/flight");

const connection = config.connection;

const arrivalsArr = [];
const departuresArr = [];

exports.getApiData = async (req, res, next) => {
  try {
    // let arrivals = await getArrivals();

    // let weather = await getWeather();

    // await sleep(2000); //wait 5 seconds
    //let departures = await getDepartures();
    //arr_iata
    //dep_iata
    // let arrivals = await getFlights("arr_iata");
    // await sleep(2000);
    // let departures = await getFlights("dep_iata");

    //let holydays = await getHolydays();
    console.log(
      `We have ${arrivalsArr.length} arrivals flights and ${departuresArr.length} departures...`
    );
    return res.status(200);
  } catch (err) {
    console.log(`Error when trying to fetch data from api: ${err}`);
    return res.status(400);
  }
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const getHolydays = async () => {
  const d = new Date();

  let month = d.getMonth() + 1; // Month	[mm]	(1 - 12)
  let day = d.getDate(); // Day		[dd]	(1 - 31)
  let year = d.getFullYear(); // Year		[yyyy]

  if (month < 10) {
    month = "0" + String(month);
  }

  if (day < 10) {
    day = "0" + String(day);
  }
  var date = `${year}-${month}-${day}`;
  console.log(date);

  let holyday;
  try {
    holyday = await axios.get(config.holydaysApi(date));

    const hebDate = Object.values(holyday.data.hebrew);

    WriteToDb("Holday");
    console.log("1 row inserted in Holyday categoery.");
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
      config.weatherApi("d9bfd2bfc72f9d427028431200e440b6", 31, 35)
    );

    const descriptions = Object.values(weather.data.weather);
    const main = weather.data.main;

    let description = descriptions[0].description;

    let temp = (main.temp - kelvinToCelcuies).toFixed(1);

    let feels_like = (main.feels_like - kelvinToCelcuies).toFixed(1);
    let humidity = main.humidity;

    let weatherObj = new Weather(description, temp, feels_like, humidity);

    WriteToDb("Weather");
    console.log("1 row inserted in Weather categoery.");
    return weatherObj;
  } catch (err) {
    console.log(
      `Error when trying to fetch data from Weather api : ${err.message}`
    );
  }
  return weather;
};

const getFlights = async (code) => {
  try {
    const flightType = await axios.get(
      config.flghtsApi(code, "tlv", "4f4056869e9045bf86d2c4bfeb31808b", 50)
    );

    const values = Object.values(flightType.data.data);

    values.forEach((element) => {
      console.log(element);

      let deprature = Object.values(element.departure);
      let arrival = Object.values(element.arrival);
      let live = Object.values(element.live);
      let flight = Object.values(element.flight);
      let flightNew = new Flight(
        flight.number,
        element.flight_date,
        element.flight_status,
        deprature.airport,
        deprature.delay,
        deprature.scheduled,
        deprature.estimated,
        deprature.actual,

        arrival.airport,
        arrival.delay,
        arrival.scheduled,
        arrival.estimated,
        arrival.actual,
        flight.live,
        live.latitude,
        live.longitude
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

const WriteToDb = (category) => {
  try {
    const d = new Date();
    let date = d.toString();
    date = date.substring(0, date.indexOf("G"));
    console.log(date);
    var sql = `INSERT INTO apicalls (Category, Date) VALUES ('${category}', '${date}')`;
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted to DB");
    });
  } catch {
    console.log("Error when trying to write to DB");
    throw err;
  }
};
