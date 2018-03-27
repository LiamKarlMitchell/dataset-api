const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const Exceptions = require('./exceptions.js')

const ROOT_DIRECTORY = process.cwd()

const Config = {
  default: yaml.safeLoad(fs.readFileSync('./config/default.yaml', 'utf-8'))
}

class Storage{
  constructor(){
    this.table = {}
    this.configuration = yaml.safeLoad(fs.readFileSync('./config/storage.yaml', 'utf-8'))
    this.setup()
  }

  setup(){
    for(let name in this.configuration){
      let configuration = this.configuration[name]

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

module.exports = new Storage
