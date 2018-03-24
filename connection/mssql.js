const Connection = require('../system/connection.js')
const sql = require('mssql')
//https://github.com/tediousjs/node-mssql
class Mssql extends Connection{

  constructor(configuration){
    super()

    var pool = new sql.ConnectionPool(configuration)
    pool.on('error', error => this.operator.emit('error', error))

    this.pool = pool
  }

  async client(){
    return this.pool.request()
  }

}

module.exports = Mssql
