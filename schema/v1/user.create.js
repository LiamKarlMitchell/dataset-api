module.exports = {
  "id": "/SimplePerson",
  "type": "object",
  "properties": {
    "name": {"type": "string"},

    "address": require('./reference.address.js'),

    "votes": {"type": "integer", "minimum": 1}
  },

  // "required": ["name", "votes"]
}
