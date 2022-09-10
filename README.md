# BigData
### Flight Delay Prediction </br>
In this project we needed to predict whether a certain flight will be delayed, and if so at what amount. </br>
The flights we needed to evaluate were flight from Israel and to Israel. </br>
We needed plan the project as a microservices model, that uses docker, kafka, mysql, redis, mongoDB and bigML. </br>
### The project is devided into 3 parts. </br>
1. Dashboard - represents the data
2. Api - retreive the data from our different api ( flight, wheather, hebrew date conversion)
3. Analytical - using bigML. </br>

Each sub category passed the data using kafka, which we ran on docker using kafka image. </br>
We need to serialize the data in order to stream it, so we used from buffer and to buffer in order to serialize and deserialize. </br>
At each sub category we had a lisiner that was running, and waited for information to come through.
Each sub category stored the data that was passed in different database. (redis, mongodb, mysql) </br>
At the end after retrieving the arrival and departure data, we needed to present them on the dashboard, so we used socket.io as a mediator to let the application know a change has been made. </br>

We created dashboard that presents the planes, and an option to see the wheather, the arrivals, the departures, and what delay they received.
