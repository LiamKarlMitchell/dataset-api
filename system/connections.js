const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const Exceptions = require('./exceptions.js')

const ROOT_DIRECTORY = process.cwd()

class Connections{
  constructor(){
    this.list = {}

    let connections
    try{
      connections = yaml.safeLoad(fs.readFileSync('./config/connection.yaml', 'utf-8'))
    }catch(e){
      throw new Exceptions.BAD_YAML_FILE(file, e.message)
    }

    for(let name in connections){
      let configuration = connections[name]
      let driver = require(path.join(ROOT_DIRECTORY, 'connection', configuration.driver))

      this.list[name] = new driver(configuration)
    }
  }

  get(name){
    let connection = this.list[name]
    if(connection === undefined){
      return null
    }

    if(!connection.connected){
      throw new Error('Connection not established')
    }

    return connection
  }
}

module.exports = new Connections
