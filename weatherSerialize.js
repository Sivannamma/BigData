
// this package is for serialize and deserialize , Faster then JSON. 
// use it for streaming objects to kafka
const avro = require('avsc');

module.exports = avro.Type.forSchema({
    type: 'record',
    fields: [
        {
            name: "description",
            type: 'string'

        },
        {
            name: "temp",
            type: 'string'

        },
        {
            name: "feels_like",
            type: 'string'

        },
        {
            name: "humidity",
            type: 'string'

        },




    ]

})