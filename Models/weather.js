module.exports = class Weather {
  constructor(description, temp, feels_like, humidity) {
    this.description = description;
    this.temp = temp;
    this.feels_like = feels_like;
    this.humidity = humidity;
  }
};
