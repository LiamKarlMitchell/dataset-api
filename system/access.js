const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

class Access{
  constructor(){
    this.access_path = path.resolve('./config/access.yaml')

    this.list = yaml.safeLoad(fs.readFileSync(this.access_path, 'utf-8'))
  }

  async for(entry){
    if(!entry.access) return {
      middleware: (request, response, next) => next()
    }

    let access = this.list[entry.access]

    if(access === undefined){
      throw new Exceptions.UNDEFINED_ACCESS(entry.access)
    }

    let driver_path = path.join(process.cwd(), 'access', access.driver)

    let driver
    try{
      driver = require(driver_path)
    }catch(e){
      throw new Exceptions.ACCESS_UNDEFINED_DRIVER(access.driver)
    }

    let result
    try{
      result = new driver(access)
    }catch(e){
      throw new Exceptions.ACCESS_DRIVER_CONSTRUCTOR(access.driver, e.message)
    }

    if(result.middleware === undefined){
      throw new Exceptions.ACCESS_MIDDLEWARE(path.join('access', access.driver))
    }

    return result
  }

  reload(){
    this.list = yaml.safeLoad(fs.readFileSync(this.access_path, 'utf-8'))
  }
}

module.exports = new Access
