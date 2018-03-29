const express = require('express')

class Cli{
  constructor(){
    this.router = express.Router()
  }

  setup(server){
    server.use('/cli', (request, response, next) => this.router(request, response, next))
  }
}

module.exports = new Cli
