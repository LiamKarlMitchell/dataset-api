const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const Exceptions = require('./exceptions.js')

const ROOT_DIRECTORY = process.cwd()

const Config = require('./config.js')

class Connections{
  constructor(){
    this.list = {}

    for(let name in Config.connections){
      let configuration = Config.connections[name]
      let driver = require(path.join(ROOT_DIRECTORY, 'connection', configuration.driver))

      this.list[name] = new driver(configuration)
    }
  }

  get(name = Config.default.connection){
    let connection = this.list[name]

    if(connection === undefined){
      throw new Exceptions.UNDEFINED_CONNECTION(name)
    }

    // TODO: Figure out how to cancel more requests if connections are bad?

    return connection
  }
}

module.exports = new Connections
