module.exports = class Flight {
  constructor(
    flight_id,
    flight_date,
    flight_status,
    departure_airport,
    departure_delay,
    departure_schedule,
    departure_estimated,
    departure_actual,
    arrival_airport,
    arrival_schedule,
    arrival_estimated,
    arrival_actual,
    arrival_delay,
    live,
    lat,
    lon,
    airline,
    source,
    destination,
    typeOfDay,
    typeOfFlight



  ) {
    this.flight_id = flight_id;
    this.flight_date = flight_date;
    this.flight_status = flight_status;
    this.departure_airport = departure_airport;
    this.departure_delay = departure_delay;
    this.departure_schedule = departure_schedule;
    this.departure_estimated = departure_estimated;
    this.departure_actual = departure_actual;
    this.arrival_airport = arrival_airport;
    this.arrival_schedule = arrival_schedule;
    this.arrival_estimated = arrival_estimated;
    this.arrival_actual = arrival_actual;
    this.arrival_delay = arrival_delay;
    this.live = live;
    this.lat = lat;
    this.lon = lon;
    this.airline = airline
    this.source = source
    this.destination = destination
    this.typeOfDay = typeOfDay
    this.typeOfFlight = typeOfFlight
  }
};
