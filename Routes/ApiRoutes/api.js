const express = require("express");
const router = express.Router();

const apiControllers = require("../../Controllers/ApiConrollers/api");

router.get("/", apiControllers.getApiData);

module.exports = router;
