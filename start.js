// const Synopsis = require('./system/synopsis.js')
const express = require('express')
const fs = require('fs')

const Connections = require('./system/connections.js')
const Exceptions = require('./system/exceptions.js')

const server = express()

const body_parser = require('body-parser')

const Logger = require('./system/logger.js')
const Versioning = require('./system/versioning.js')
const Cli = require('./system/cli.js')

server.disable('x-powered-by')

server.use(body_parser.urlencoded({ extended: false }))
server.use(body_parser.json())

server.use((request, response, next) => {
  let type = request.headers['content-type'] || 'application/json'

  if( type !== 'application/x-www-form-urlencoded' &&
      type !== 'application/json')
  {
    throw new Exceptions.BAD_REQUEST
  }

  next()
})

// TODO: Add access middleware to Cli.
Cli.setup(server)

Versioning.setup(server)


server.use((e, request, response, next) => {
  // TODO: 3 types of error responses.
  // INTERNAL_ERROR:
  // RESPONSE_ERROR:
  // REQUEST_ERROR:
  // Each of the types will include its own unique error code.
  // {error: e.type, code: e.code, message: e.message}
  // One general error code, for things we are not able to track or define with the code?

  Logger.error(e.message)
  Logger.trace(e.stack)

  if(e.code === undefined) e.code = 500

  response.status(e.code).json({error: e.type, message: e.message})
})

server.listen(8080, () => {
  Logger.log('Server listetning at 8080 port')
})
