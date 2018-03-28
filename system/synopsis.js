const express = require('express')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const decache = require('decache')

const Access = require('./access.js')
const Storage = require('./storage.js')
const Exceptions = require('./exceptions.js')
const Connections = require('./connections.js')
const Validator = new (require('jsonschema').Validator)
const Util = require('./util.js')

const ROOT_DIRECTORY = process.cwd()

const Config = {
  default: yaml.safeLoad(fs.readFileSync(path.resolve('./config/default.yaml'), 'utf-8'))
}

class Synopsis{
  constructor(directory, version){
    this.router
    this.version = version
    this.directory = directory
    this.document_path = path.join(this.directory, 'synopsis.yaml')

    try{
      this.synopsis = yaml.safeLoad(fs.readFileSync(this.document_path), 'utf-8')
    }catch(e){
      throw new Exceptions.BAD_YAML_FILE(file, e.message)
    }

    this.setup()
  }

  setup(){
    let reloaded_router = express.Router()

    for(let route in this.synopsis){
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

      let entry = this.synopsis[route]
      let router = express.Router()


      if(entry === null || entry === undefined) throw new Exceptions.ROUTE_ACTION_REQUIRED


      /*
      Access middleware setup for route entry.
      */

      this.setup_access(router, entry)


      /*
      Cache middleware setup with request cache settings.
      */

      this.setup_cache(router, (entry.request && entry.request.cache) ? entry.request.cache : null)


      /*
      Validation settings for input body.
       */

      this.setup_validation(router, entry.validation)


      /*
      Switch between setuping simple storage query or more advanced
      middleware setup with pre and post functions.
      Otherwise if none of above found, it will raise exception to define
      one of them. As action on route is required (no empty routes).

      Middleware optionally offers pre and post async functions.
       */

      if(entry.query){
        this.setup_query(router, entry.query)
      }else if(entry.middleware){
        this.setup_middleware(router, entry.middleware)
      }else{
        throw new Exceptions.ROUTE_ACTION_REQUIRED
      }


      /*
      In setup response we are storing the cache if needed and applying headers.
       */

      /*
      In response, we are checking for response.result, if found, we send it with headers.
      Otherwise we raise an error.
      Headers are set in setup response. So the response is good to go.
       */


      this.setup_response(router, entry.response)

      /*
      Final response. Applies headers from response.result if found.
      Otherwise there must be a request.result in it.
       */

      router.use((request, response, next) => {
        let result, headers = null
        if(Array.isArray(response.result)){
          [result, headers] = response.result
        }else{
          result = request.result
        }

        for(let header in Config.default.headers){
          response.set(Util.normalize(header), Config.default.headers[header])
        }

        for(let header in headers){
          response.set(Util.normalize(header), headers[header])
        }

        response.status(200).json(result)
      })

      reloaded_router[method.toLowerCase()].call(reloaded_router, route_path, router)
    }

    this.router = reloaded_router
  }

  setup_cache(router, cache){
    if(cache === null || cache.enabled === false) return

    router.use((request, response, next) => {
      let driver = Storage.get(cache.driver)
      let entry = driver.get(request.url)

      if(!(entry instanceof Promise) && !(entry instanceof Util.AsyncFunction)){
        throw new Exceptions.CACHE_RESULT
      }

      entry.then(cache => {
        if(!cache) return next()

        let [result, headers] = cache

        for(let header in Config.default.headers){
          response.set(Util.normalize(header), Config.default.headers[header])
        }

        for(let header in headers){
          response.set(Util.normalize(header), headers[header])
        }

        return response.status(200).json(result)
      })
      .catch(e => { throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message) })
      .catch(next)
    })
  }

  setup_access(router, entry){
    router.use((request, response, next) => {
      Access.for(entry)
      .then(access => {
        access.middleware(request, response, next)
      })
      .catch(e => {
        throw new Exceptions.ACCESS_EXCEPTION(e.message)
      })
      .catch(e => next(e))
    })
  }

  setup_validation(router, validation){
    if(validation === null || validation === undefined) return

    let type = typeof validation.schema

    if(type === 'string'){
      let validator_path = path.join(ROOT_DIRECTORY, 'schema', validation.schema)

      router.use((request, response, next) => {
        let schema
        try{
          schema = require(validator_path)
        }catch(e){
          // TODO: Throw better error
          throw e
        }

        let result = Validator.validate(request.body, schema)

        if(result.valid) return next()

        let err = result.errors[0]
        throw new Exceptions.VALIDATON_ERROR(validation.schema, (typeof err.schema === 'string' ? err.schema : 'unidentified'), err.message.replace(/\"/g, '\''))
      })
    }

    if(type === 'object' || type === 'undefined'){
      let fields = Object.keys(validation)

      // TODO: Better validation place, and maintainability!

      router.use((request, body, next) => {
        let data = request.body
        let values = []

        for(let name in data){
          if(!fields.includes(name)) {
            throw new Exceptions.REQUEST_BAD_FIELD(name)
          }

          values.push(name)
        }

        for(let index in fields){
          let field = fields[index]
          let requirements = validation[field]

          if(requirements === null || requirements === undefined) continue

          if(requirements.required && !values.includes(field)){
            throw new Exceptions.VALIDATION_REQUIRE_VALUE(field)
          }

          let value = data[field]

          if(value && requirements.length){
            let min = requirements.length.min
            let max = requirements.length.max
            let length = value.length // TODO: Get that using the actual data type? If set. Default: string

            if(typeof min === 'number' && min < length){
              throw new Exceptions.MIN_LENGTH_REQUIRED(field, min)
            }

            if(typeof max === 'number' && max < length){
              throw new Exceptions.MAX_LENGTH_REQUIRED(field, max)
            }
          }

          if(value && requirements.match){
            let regex = new RegExp(requirements.match)

            if(!regex.test(value)){
              throw new Exceptions.VALIDATION_REGEX_MISMATCH(field)
            }
          }
        }

        next()
      })
    }
  }

  setup_middleware(router, p){
    let middleware_path = path.join(this.directory, p)

    let handler
    try{
      handler = require(middleware_path)
    }catch(e){
      // TODO: Get line properly, from stack?
      throw new Exceptions.MIDDLEWARE_HANDLER(e.message, handler_path, 'Unknown')
    }

    if(!handler.middleware){
      throw new Exceptions.MIDDLEWARE_NOT_DEFINED(path.join(this.version, p))
    }


    /*
    Using pre handler if defined
     */

    if(handler.pre){
      router.use((request, response, next) => {
        let result = handler.pre(request, response, next)

        if((!result instanceof Promise) && (!result instanceof Util.AsyncFunction)){
          throw new Exceptions.MIDDLEWARE_RESULT('handler.pre')
        }

        result.then(() => next())
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


    /*
    Using middleware
     */

    router.use((request, response, next) => {
      let result = handler.middleware(request, response, next)

      if(!(result instanceof Promise) && !(result instanceof Util.AsyncFunction)){
        throw new Exceptions.MIDDLEWARE_RESULT('handler.middleware')
      }

      result.then(result => {
        request.result = result
        next()
      })
      .catch(e => {
        if(e.code === undefined){
          throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message)
        }else{
          throw e
        }
      })
      .catch(next)
    })


    /*
    Using post handler if defined
     */

    if(handler.post){
      router.use((request, response, next) => {
        let result = handler.post(request, response, next)

        if(!(result instanceof Promise) && !(result instanceof Util.AsyncFunction)){
          throw new Exceptions.MIDDLEWARE_RESULT('handler.post')
        }

        result.then(() => next())
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
  }

  setup_query(router, query){
    let script = path.join(this.directory, query.script)

    router.use((request, response, next) => {
      let connection = Connections.get(query.connection)

      let result = connection.execute(script, {
        query: request.query,
        param: request.params,
        form: request.body
      })

      if(!(result instanceof Promise) && !(result instanceof Util.AsyncFunction)){
        throw new Exceptions.MIDDLEWARE_RESULT('connection.execute')
      }

      result.then(result => {
        request.result = result
        next()
      })
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

  setup_response(router, option = null){
    if(option === null) return

    router.use((request, response, next) => {
      if(option.cache && option.cache.enabled){
        let driver = Storage.get(option.cache.driver)

        let cached_response = [request.result, option.headers]

        driver.put(request.url, cached_response, option.cache.ttl)
        .then(result => {
          response.result = result
          next()
        })
        .catch(e => { throw new Exceptions.MIDDLEWARE_EXCEPTION(e.message) })
        .catch(next)
      }else{
        response.result = [request.result, option.headers]
      }
    })
  }
}

module.exports = Synopsis
