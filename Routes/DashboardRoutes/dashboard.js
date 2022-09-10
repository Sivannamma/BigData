const express = require("express");
const router = express.Router();

const dashboardControllers = require("../../Controllers/DashboardControllers/dashboard");


//console.log("dashboard route.....");
router.get("/", dashboardControllers.showDashboard);

//router.get("/arrivals", dashboardControllers.showDashboard);


router.post("/arrivals", dashboardControllers.showArrivals);


module.exports = router;
