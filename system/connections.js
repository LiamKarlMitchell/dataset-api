const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const Exceptions = require('./exceptions.js')

const ROOT_DIRECTORY = process.cwd()

const Config = {
  default: yaml.safeLoad(fs.readFileSync('./config/default.yaml', 'utf-8'))
}

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

  get(name = Config.default.connection){
    let connection = this.list[name]

    if(connection === undefined){
      throw new Exception.UNDEFINED_CONNECTION(name)
    }

    // TODO: Figure out how to cancel more requests if connections are bad?

    return connection
  }
}

module.exports = new Connections
