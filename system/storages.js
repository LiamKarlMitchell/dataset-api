const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const Exceptions = require('./exceptions.js')

const ROOT_DIRECTORY = process.cwd()

const Config = require('./config.js')

class Storages{
  constructor(){
    this.table = {}
    this.setup()
  }

  setup(){
    for(let name in Config.storage){
      let configuration = Config.storage[name]

      let driver = require(path.join(ROOT_DIRECTORY, configuration.driver))

      this.table[name] = new driver(configuration)
    }
  }

  get(name = Config.default.storage){
    let driver = this.table[name]

    if(driver === undefined) throw new Exceptions.UNDEFINED_STORAGE_DRIVER(name)

    return driver
  }
}

module.exports = new Storages
