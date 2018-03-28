const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const Exceptions = require('./exceptions.js')

const paths = {}

class Config{
  constructor(){}

  load(file){
    let destination = path.join(process.cwd(), 'config', file)
    let p = path.parse(destination)
    let template = null

    if(!fs.existsSync(destination)){
      template = path.join(process.cwd(), 'config', p.name + '.default' + p.ext)
    }

    if(template !== null){
      if(!fs.existsSync(template)){
        throw new Exceptions.MISSING_CONFIGURATION_FILE(path.join('config', file))
      }else{
        fs.writeFileSync(destination, fs.readFileSync(template))
      }
    }

    if(this[p.name]){
      throw new Exceptions.DUPLICATED_CONFIGURATION(p.name, typeof this[p.name])
    }

    paths[p.name] = p

    try{
      let configuration = this[p.name] = yaml.safeLoad(fs.readFileSync(destination, 'utf-8'), 'utf-8')
    }catch(e){
      throw new Exceptions.CONFIGURATION_FILE_EXCEPTION(p.name, e.message)
    }
  }

  get(name){
    let configuration = this[name]

    if(!configuration){
      throw new Exceptions.MISSING_CONFIGURATION_FILE(name)
    }

    return configuration
  }

  reload(name){
    let configuration = this[name]

    if(!configuration){
      throw new Exceptions.MISSING_CONFIGURATION_FILE(name)
    }

    let p = paths[name]
    let destination = path.join(process.cwd(), 'config', p.base)

    try{
      this[p.name] = yaml.safeLoad(fs.readFileSync(destination, 'utf-8'), 'utf-8')
    }catch(e){
      throw new Exceptions.CONFIGURATION_FILE_EXCEPTION(p.name, e.message)
    }
  }
}

module.exports = new Config
