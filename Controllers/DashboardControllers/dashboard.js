const { json } = require("express");

const config = require("../../Models/config");


const redis = require("redis");



exports.showDashboard = (req, res, next) => {

  res.render('dashboard')

}

exports.showArrivals = (req, res, next) => {
  const flights = req.body.flights;
  console.log(flights);


  res.render("arrivals", {
    flights: flights,

  });


};

