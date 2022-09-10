const arrivalFlightsApi = (code, accessKey, limit) =>
  `http://api.aviationstack.com/v1/flights?arr_iata=${code}&limit=${limit}&access_key=${accessKey}`;

const departurelFlightsApi = (code, accessKey, limit) =>
  `http://api.aviationstack.com/v1/flights?dep_iata=${code}&limit=${limit}&access_key=${accessKey}`;

const flghtsApi = (flightType, code, accessKey, limit) =>
  `http://api.aviationstack.com/v1/flights?${flightType}=${code}&flight_status=active&limit=${limit}&access_key=${accessKey}`;

const historicalFlghtsApi = (flightType, code, accessKey, flightStatus, limit) =>
  `http://api.aviationstack.com/v1/flights?${flightType}=${code}&flight_status=${flightStatus}&limit=${limit}&access_key=${accessKey}`;

const weatherApiAI = (lat, lon, access_key) =>
  `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?key=${access_key}`;


const countryCoordinatesByCityNameApi = (city, access_key) =>
  `http://api.positionstack.com/v1/forward?access_key=${access_key}&query=${city}`;

const weatherApi = (appId, lat, lon) =>
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appId}`;

const holydaysApi = (date) =>
  `https://www.hebcal.com/converter?cfg=json&date=${date}&g2h=1&strict=1`;

var mysql = require("mysql");

config = {
  host: "localhost",
  user: "root",
  password: "elad12345",
  database: "apiaccess",
};


var connection = mysql.createConnection(config); //added the line
connection.connect(function (err) {
  if (err) {
    console.log("error connecting:" + err.stack);
  }
  console.log("connected successfully to DB.");
});

module.exports = {
  arrivalFlightsApi,
  departurelFlightsApi,
  flghtsApi,
  weatherApi,
  holydaysApi,
  historicalFlghtsApi,
  countryCoordinatesByCityNameApi,
  weatherApiAI,
  connection: mysql.createConnection(config),
};
