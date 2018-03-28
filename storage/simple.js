const Storage = require('../system/storage.js')

class Simple extends Storage{
  constructor(configuration){
    super()

    this.values = {}
    this.expiry_table = {}
  }

  async put(key, value, expires_in){
    this.values[key] = value
    await this.expire(key, expires_in)
    return value
  }

  async get(key){
    let value = this.values[key]
    if(value === undefined){
      return null
    }

    return value
  }

  async patch(key, value){
    if(this.values[key]){
      this.values[key] = value
    }
  }

  async invalidate(key){
    delete this.values[key]
    clearTimeout(this.expiry_table[key])
    delete this.expiry_table[key]
  }

  async expire(key, expires_in){
    clearTimeout(this.expiry_table[key])

    if(expires_in){
      this.expiry_table[key] = setTimeout(() => {
        this.invalidate(key)
      }, expires_in * 1000)
    }
  }
}

module.exports = Simple
