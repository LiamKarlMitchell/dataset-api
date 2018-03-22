const Exceptions = require('../system/exceptions.js')

class Simple{
  constructor(config){
    this.key = config.key
  }

  middleware(request, response, next){
    let authorization = request.headers.authorization

    if(authorization !== this.key){
      throw new Exceptions.BAD_AUTHORIZATION
    }

    next()
  }
}

module.exports = Simple
