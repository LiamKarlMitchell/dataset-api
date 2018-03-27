const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')

class Logger{
  constructor(){
  }

  log(){ throw new Error('Logger class, missing override `Logger.log`') }
  debug(){ throw new Error('Logger class, missing override `Logger.debug`') }
  trace(){ throw new Error('Logger class, missing override `Logger.trace`') }
  warn(){ throw new Error('Logger class, missing override `Logger.warn`') }
  error(){ throw new Error('Logger class, missing override `Logger.error`') }
  fatal(){ throw new Error('Logger class, missing override `Logger.fatal`') }
}

module.exports.class = Logger

const Default = yaml.safeLoad(fs.readFileSync('./config/default.yaml'), 'utf-8')
const Driver = require(path.join(process.cwd(), 'logger', Default.logger.driver))
module.exports = new Driver
