const util = require('util')

console.log(util.format.apply(null, ['tesst: %d', 1]))
