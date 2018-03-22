const Connection = require('../system/connection.js')
const mysql = require('mysql')

class Mysql extends Connection{

  constructor(configuration){
    super()

    this.agent = mysql.createPool(configuration)
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
