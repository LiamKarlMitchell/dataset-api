const yaml = require('js-yaml')
const fs = require('fs')
const util = require('util')

let exceptions = yaml.safeLoad(fs.readFileSync('./config/exceptions.yaml', 'utf-8'))

for(let name in exceptions){
  let exception = exceptions[name]

  module.exports[name] = function Exception(){
    let args = Array.from(arguments)

    args.unshift(exception.message)

    let message = util.format.apply(null, args)

    let err = new Error(message)

    err.code = exception.code

    if(exception.type){
      err.type = exception.type
    }

    return err
  }
}
