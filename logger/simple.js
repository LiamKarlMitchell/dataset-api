const util = require('util')
const Logger = require('../system/logger.js').class

class Simple extends Logger{
  constructor(){
    super()
  }

  log(){
    console.log('\x1b[35mLOG:\x1b[0m', util.format.apply(null, arguments))
  }

  debug(){
    console.log('\x1b[35mDEBUG:\x1b[0m', util.format.apply(null, arguments))
  }

  trace(){
    console.log('\x1b[35mTRACE:\x1b[0m', util.format.apply(null, arguments))
  }

  warn(){
    console.log('\x1b[35mWARN:\x1b[0m', util.format.apply(null, arguments))
  }

  error(){
    console.log('\x1b[35mERROR:\x1b[0m', util.format.apply(null, arguments))
  }

  fatal(){
    console.log('\x1b[35mFATAL:\x1b[0m', util.format.apply(null, arguments))
  }
}

module.exports = Simple
