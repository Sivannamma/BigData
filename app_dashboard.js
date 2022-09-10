
const Kafka = require("node-rdkafka");
const dashBoard = require("./Routes/DashboardRoutes/dashboard");

const flightType = require("./flightSerialize")
const weatherType = require("./weatherSerialize")


let weatherObj = null;



const Redis = require("ioredis")

const redis = new Redis({})

const express = require('express');
const app = express();

// configurations for socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
// const e = require('express');
// const { brotliDecompressSync } = require('zlib');
const io = new Server(server);


app.use("/", dashBoard)


io.on('connection', (socket) => {

  console.log(`User connected with socket it ${socket.id}`);
  socket.on('message', (msg) => {
    console.log(`Got from client : ${msg}`);


  });
  socket.on('messageArr', (msg) => {
    console.log(`Got from client : ${msg}`);


  });
  socket.on('messageDep', (msg) => {
    console.log(`Got from client : ${msg}`);


  });


  socket.on('disconnect', () => {
    console.log(`User disconnected with socket it ${socket.id}`);
  });


});
app.set("views", "views");
app.set("view engine", "ejs");

const port = 3000;
server.listen(port, async () => {
  console.log("Listening on port " + port);


  // DELETE FORM REDIS

  // await redis.keys('*', function (err, keys) {
  //   if (err) return console.log(err);
  //   console.log("Iterating on keys...");
  //   for (let i = 0; i < keys.length; i++) {
  //     redis.del(keys[i], function (err, response) {
  //       if (response == 1) {
  //         console.log("Deleted Successfully!")
  //       } else {
  //         console.log("Cannot delete")
  //       }
  //     })
  //   }




  // });


});



const weatherConsumer = Kafka.KafkaConsumer({
  // parameter 1 -group id and broker
  // parameter 2 - options

  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092'
}, {});




const arrivalConsumer = Kafka.KafkaConsumer({
  // parameter 1 -group id and broker
  // parameter 2 - options

  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092'
}, {});




const departureConsumer = Kafka.KafkaConsumer({
  // parameter 1 -group id and broker
  // parameter 2 - options

  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092'
}, {});




const finishConsumer = Kafka.KafkaConsumer({
  // parameter 1 -group id and broker
  // parameter 2 - options

  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092'
}, {});


// connect to the broker
weatherConsumer.connect();
arrivalConsumer.connect();
departureConsumer.connect();





weatherConsumer.on('ready', () => {
  console.log("Weather Consumer is ready");

  // we need to fetch events from topic
  // array of topics , filter by topic name
  weatherConsumer.subscribe(['weathereTopic']);
  weatherConsumer.consume();

  // any new data comes in
}).on('data', async (data) => {
  console.log(`Recevied weather :   ${weatherType.fromBuffer(data.value)}`);

  weatherObj = weatherType.fromBuffer(data.value);


  const result = await redis.set('weather', weatherObj.temp);
  console.log("Inserted to Redis in weather listener " + result);
  io.emit('message', weatherObj.temp);



})


arrivalConsumer.on('ready', () => {
  console.log("Arrival Consumer is ready");

  // we need to fetch events from topic
  // array of topics , filter by topic name
  arrivalConsumer.subscribe(['test']);
  arrivalConsumer.consume();

  // any new data comes in
}).on('data', async (data) => {



  let arrivalObj = flightType.fromBuffer(data.value);

  try {
    const res = await redis.set(arrivalObj.flight_id + "Arrival", arrivalObj, function (err, res2) {
      console.log(`Inserting to arrival list this filight with id ${arrivalObj.flight_id} from Redis in arrival listener ${res2}`);
    });




    // pass to client
    io.emit('messageArr', arrivalObj)
  }
  catch (err) {
    console.log(`Failed to insert to redis db arrival flight : ${err}`);
  }




})




departureConsumer.on('ready', () => {
  console.log("Departure Consumer is ready");

  // we need to fetch events from topic
  // array of topics , filter by topic name
  departureConsumer.subscribe(['departureTopic']);
  departureConsumer.consume();

  // any new data comes in
}).on('data', async (data) => {
  let departurelObj = flightType.fromBuffer(data.value);


  try {
    const res = await redis.set(departurelObj.flight_id + "Departure", departurelObj, function (err, res2) {
      console.log(`Inserting to departure list this flight with id ${departurelObj.flight_id} from Redis in departure listener ${res2}`);
    });

    io.emit('messageDep', departurelObj)
  }
  catch (err) {
    console.log(`Failed to insert to redis db departure flight : ${err}`);
  }

})




