const path = require('path')
const Synopsis = require('./synopsis.js')
const fs = require('fs')

const Exceptions = require('./exceptions.js')

const SET_PATH = path.join(process.cwd(), 'dataset')

class Versioning{
  constructor(){
    this.list = {}
    this.server
  }

  setup(server){
    this.server = server

    let set = fs.readdirSync(SET_PATH)

    for(let index in set){
      let version = set[index]
      let synopsis = this.list[version] = new Synopsis(path.join(SET_PATH, version), version)

      this.server.use('/api/' + version, (req, res, next) => {
        synopsis.router(req, res, next)
      })
    }
  }

  reload(){
    let set = fs.readdirSync(SET_PATH)

    for(let index in set){
      let version = set[index]

      if(this.list[version]){
        this.list[version].reload()
        continue
      }

      let synopsis = this.list[version] = new Synopsis(path.join(SET_PATH, version), version)

      this.server.use('/api/' + version, (req, res, next) => {
        synopsis.router(req, res, next)
      })
    }
  }
}

module.exports = new Versioning
