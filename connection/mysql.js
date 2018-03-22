const Connection = require('../system/connection.js')
const mysql = require('mysql')

class Mysql extends Connection{

  constructor(configuration){
    super()

    this.agent = mysql.createPool(configuration)

    this.client()
    .then(connection => {
      connection.release()
      this.operator.emit('connect')
    })
    .catch((e) => {
      this.operator.emit('error', e, true)
    })
  }

  async client(){
    return new Promise((resolve, reject) => {
      this.agent.getConnection((e, connection) => {
        if(e){
          return reject(e)
        }

        resolve(connection)
      })
    })
  }

}

module.exports = Mysql
