
// this package is for serialize and deserialize , Faster then JSON. 
// use it for streaming objects to kafka
const avro = require('avsc');

module.exports = avro.Type.forSchema({
    type: 'record',
    fields: [
        {
            name: "flight_id",
            type: 'string'

        },
        {
            name: "flight_date",
            type: 'string'

        },
        {
            name: "flight_status",
            type: 'string'

        },
        {
            name: "departure_airport",
            type: 'string'

        },
        {
            name: "departure_delay",
            type: 'string'

        },
        {
            name: "departure_schedule",
            type: 'string'

        },
        {
            name: "departure_estimated",
            type: 'string'

        },


        {
            name: "departure_actual",
            type: 'string'

        },
        {
            name: "arrival_airport",
            type: 'string'

        },
        {
            name: "arrival_schedule",
            type: 'string'

        },
        {
            name: "arrival_estimated",
            type: 'string'

        },

        {
            name: "arrival_actual",
            type: 'string'

        },
        {
            name: "arrival_delay",
            type: 'string'

        },
        {
            name: "live",
            type: 'string'

        },
        {
            name: "lat",
            type: 'string'

        },
        {
            name: "lon",
            type: 'string'

        },

        {
            name: "airline",
            type: 'string'

        },


        {
            name: "source",
            type: 'string'

        },
        {
            name: "destination",
            type: 'string'

        },
        {
            name: "typeOfDay",
            type: 'string'

        },
        {
            name: "typeOfFlight",
            type: 'string'

        }




    ]

})