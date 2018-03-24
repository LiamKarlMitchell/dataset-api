const Synopsis = require('./system/synopsis.js')
const express = require('express')

const Connections = require('./system/connections.js')
const Exceptions = require('./system/exceptions.js')

const server = express()

const body_parser = require('body-parser')

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

let router = express.Router()

// TODO: Add router CLI with access middleware.

// router.get('/reload/:item', (request, response) => {
//   try{
//     Synopsis.reload()
//   }catch(e){
//     return response.status(500).json({error: e.message})
//   }
//
//   response.status(200).json({error: null})
// })

server.use('/cli', router)

server.use('/api', (req, res, next) => {
  Synopsis.router(req, res, next)
})

server.use((e, request, response, next) => {
  // TODO: 3 types of error responses.
  // INTERNAL_ERROR:
  // RESPONSE_ERROR:
  // REQUEST_ERROR:
  // Each of the types will include its own unique error code.
  // {error: e.type, code: e.code, message: e.message}
  // One general error code, for things we are not able to track or define with the code?

  console.log(e, 'code :', e.code)

  if(e.code === undefined) e.code = 500

  response.status(e.code).json({error: e.type, message: e.message})
})

server.listen(8080, () => {
  // console.log('%s listening at %s', server.name, server.url)
  console.log('Server listetning at 8080 port')
})
