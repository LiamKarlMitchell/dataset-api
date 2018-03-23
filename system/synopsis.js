const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const express = require('express')
const decache = require('decache')
const Storage = require('./storage.js')
const Exceptions = require('./exceptions.js')

const AsyncFunction = (async () => {}).constructor

const Config = {
  Access: yaml.safeLoad(fs.readFileSync(path.resolve('./config/access.yaml'), 'utf-8')),
  Default: yaml.safeLoad(fs.readFileSync(path.resolve('./config/default.yaml'), 'utf-8')),
}

const ROOT_DIRECTORY = process.cwd()

const Validator = new (require('jsonschema').Validator)

class Synopsis{
  constructor(){
    this.router = express.Router()
    this.document

    this.reload()
  }

  reload(){
    let router = express.Router()

    let file = fs.readFileSync(path.resolve('./dataset/synopsis.yaml'))

    try{
      this.document = yaml.safeLoad(file, 'utf-8')
    }catch(e){
      throw new Exceptions.BAD_YAML_FILE(file, e.message)
    }

    for(let route in this.document){
      let definition = route.split(' ')

      for(let i=0; i<definition.length; i++){
        if(definition[i].trim().length === 0){
          definition.splice(i, 1)
        }
      }

      if(definition.length !== 2){
        throw new Exceptions.ROUTE_DEFINITION
      }

      let [method, route_path] = definition

      if(!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())){
        throw new Exceptions.ROUTE_DEFINITION
      }

      let entry = this.document[route]
      let path_handler = path.join(ROOT_DIRECTORY, 'dataset', entry.middleware)

      decache(path_handler)

      let handler
      try{
        handler = require(path_handler)
      }catch(e){
        let stack = e.stack.split("\n")
        let at = stack[1].match(/[0-9]+\:[0-9]+/)
        let line = at === null ? 'Unknown' : at[0]
      }

      let access = this.getAccess(entry)

      let trip = []

      trip.push((request, response, next) => access.middleware(request, response, next))

      if(entry.request && entry.request.cache && entry.request.cache.enabled){
        let cache = entry.request.cache

        trip.push((request, response, next) => {
          let driver = Storage.get(cache.driver)
          let entry = driver.get(request.url)

          if(!entry instanceof Promise && !entry instanceof AsyncFunction){
            throw new Exceptions.CACHE_RESULT
          }

          entry.then(cache => {
            if(!cache) return next()

            let [result, headers] = cache

            this.set(response, headers)

            return response.status(200).json(result)
          })
          .catch(e => { throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message) })
          .catch(next)
        })
      }

      trip.push((request, response, next) => {
        if(entry.validation && entry.validation.schema) return next()

        let data = request.body
        let values = []

        if(entry.fields && entry.fields instanceof Array){
          for(let name in data){
            if(!entry.fields.includes(name)) {
              throw new Exceptions.REQUEST_BAD_FIELD(name)
            }

            values.push(name)
          }
        }

        if(entry.validation){
          for(let name in entry.validation){
            let validation = entry.validation[name]

            if(!validation) continue

            if(validation.required && !values.includes(name)){
              throw new Exceptions.VALIDATION_REQUIRE_VALUE(name)
            }

            let value = data[name]

            if(value && validation.length){
              let min = validation.length.min
              let max = validation.length.max
              let length = value.length // TODO: Get that using the actual data type? If set. Default: string

              if(typeof min === 'number' && min < length){
                throw new Exceptions.MIN_LENGTH_REQUIRED(name, min)
              }

              if(typeof max === 'number' && max < length){
                throw new Exceptions.MAX_LENGTH_REQUIRED(name, max)
              }
            }

            if(value && validation.match){
              let regex = new RegExp(validation.match)

              if(!regex.test(value)){
                throw new Exceptions.VALIDATION_REGEX_MISMATCH(name)
              }
            }
          }
        }

        next()
      })

      let pre_function = handler && handler.pre ? handler.pre : null

      if(pre_function instanceof Promise || pre_function instanceof AsyncFunction){
        trip.push((request, response, next) => {
          pre_function()
          .then(() => { next() })
          .catch(e => {
            if(e.code === undefined){
              throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message)
            }else{
              throw e
            }
          })
          .catch(next)
        })
      }

      trip.push((request, response, next) => {
        let result = handler.middleware(request, response, next)

        if(!result instanceof Promise && !result instanceof AsyncFunction){
          throw new Exceptions.MIDDLEWARE_RESULT
        }

        result.then(result => {
          request.result = result
          next()
        })
        .catch(e => { throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message) })
        .catch(next)
      })

      trip.push((request, response, next) => {
        if(!entry.validation || !entry.validation.schema) return next()

        let validator_path = path.join(ROOT_DIRECTORY, 'schema', entry.validation.schema)

        let schema = require(validator_path)
        let result = Validator.validate(request.result, schema)

        if(result.valid) return next()

        let err = result.errors[0]
        throw new Exceptions.VALIDATON_ERROR(entry.validation.schema, (typeof err.schema === 'string' ? err.schema : 'unidentified'), err.message.replace(/\"/g, '\''))
      })

      let post_function = handler && handler.post ? handler.post : null

      if(post_function instanceof Promise || post_function instanceof AsyncFunction){
        trip.push((request, response, next) => {
          post_function()
          .then(() => { next() })
          .catch(e => {
            if(e.code === undefined){
              throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message)
            }else{
              throw e
            }
          })
          .catch(next)
        })
      }

      trip.push((request, response, next) => {
        // TODO: Set cache headers if needed, etc.
        // TODO: Cache the response sent, for reconstruction in this middleware.

        let headers = entry.response && entry.response.headers ? entry.response.headers : null

        if(entry.request && entry.request.cache && entry.request.cache.enabled){
          let cache = entry.request.cache
          let driver = Storage.get(cache.driver)

          let cached_response = [request.result, headers]

          driver.put(request.url, cached_response, cache.ttl)
          .then(result => {
            response.result = result
            next()
          })
          .catch(e => { throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message) })
          .catch(next)
        }else{
          response.result = [request.result, headers]
          next()
        }
      })

      trip.push((request, response) => {
        let [result, headers] = response.result

        this.set(response, headers)

        response.status(200).json(result)
      })

      let router_method = router[method.toLowerCase()]

      for(let index in trip){
        router_method.call(router, route_path, trip[index])
      }
    }

    this.router = router
  }

  set(response, headers){
    for(let header in Config.Default.headers){
      response.set(this.normalizeHeader(header), Config.Default.headers[header])
    }

    for(let header in headers){
      response.set(this.normalizeHeader(header), headers[header])
    }
  }

  getAccess(entry){
    if(!entry.access) return {
      middleware: (request, response, next) => next()
    }

    let access = Config.Access[entry.access]

    if(access === undefined){
      throw new Exceptions.UNDEFINED_ACCESS(entry.access)
    }

    let driver_path = path.join(ROOT_DIRECTORY, 'access', access.driver)

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

  normalizeHeader(name){
    let parts = name.split('-')
    for(let i in parts){ parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1) }
    return parts.join('-')
  }
}

module.exports = new Synopsis
