const Connections = require(process.cwd() + '/system/connections.js')
const Exceptions = require(process.cwd() + '/system/exceptions.js')

module.exports.pre = async () => {
  // throw new Exceptions.BAD_REQUEST
}

module.exports.middleware = async (request, response) => {
  // let connection = Connections.get('test')
  // let client = await connection.client()
  //
  // console.log('test middleware')
  // console.log(request.params, request.query)
  //
  let result = {
    blah: 'Maybe not as defined as schema?'
  }
  //
  // client.release()

  return result
}

module.exports.post = async () => {
  // throw new Exceptions.BAD_REQUEST
}
