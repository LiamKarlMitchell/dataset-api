const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')
const Exceptions = require('./exceptions.js')

class Logger{
  constructor(){
  }

  log(){ throw new Exceptions.UNDEFINED_METHOD('override `Logger.log`', 'system/logger.js') }
  debug(){ throw new Exceptions.UNDEFINED_METHOD('override `Logger.debug`', 'system/logger.js') }
  trace(){ throw new Exceptions.UNDEFINED_METHOD('override `Logger.trace`', 'system/logger.js') }
  warn(){ throw new Exceptions.UNDEFINED_METHOD('override `Logger.warn`', 'system/logger.js') }
  error(){ throw new Exceptions.UNDEFINED_METHOD('override `Logger.error`', 'system/logger.js') }
  fatal(){ throw new Exceptions.UNDEFINED_METHOD('override `Logger.fatal`', 'system/logger.js') }
}

module.exports.class = Logger

const Default = yaml.safeLoad(fs.readFileSync('./config/default.yaml'), 'utf-8')
const Driver = require(path.join(process.cwd(), 'logger', Default.logger.driver))
module.exports = new Driver
