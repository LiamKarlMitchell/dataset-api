var Validator = require('jsonschema').Validator;
var v = new Validator();

let schema = require('../schema/v1/user.create.js')

var p = {
  "name": "Barack Obama",
  "address": {
    "lines": [ "1600 Pennsylvania Avenue Northwest" ],
    "zip": "DC 20500",
    "city": "Washington",
    "country": "USA"
  },
  "votes": "lots"
};

console.log(schema)

console.log(v.validate(p, schema))
