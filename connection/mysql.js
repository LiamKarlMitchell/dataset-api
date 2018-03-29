const Connection = require('../system/connection.js')
const mysql = require('promise-mysql')

class Mysql extends Connection{

  constructor(configuration){
    super()

    this.pool = mysql.createPool(configuration)

    // The pool will emit an acquire event when a connection is acquired from the pool.
    // This is called after all acquiring activity has been performed on the connection, right before the connection is handed to the callback of the acquiring code.
    this.pool.on('acquire', (connection) => {
      console.log('Connection %d acquired', connection.threadId);
    });

    // The pool will emit a connection event when a new connection is made within the pool.
    // If you need to set session variables on the connection before it gets used, you can listen to the connection event.
    this.pool.on('connection', (connection) => {
      // Note: We could use this for set options, and also if we need to set variables for user to use in triggers for modifiedby etc.
      //connection.query('SET SESSION auto_increment_increment=1')

      // MySQL Specific PING server for keep-alive.
      // For long running queries you may want to ping. (Although I don't think anything should take 30 minutes too query who knows!)
      if (configuration.ping == true) {
        // If the connection does not have an interval set then make one that pings.
        if (!connection.ping_interval) {
          connection.ping_interval = setInterval(function MySQL_DO_PING(){
            connection.ping().then(function(){
              // Intentionally do nothing here.
            }).catch(function(error){
              // Error. // TODO: propper error handling on mysql ping fail.
              console.error(error)
            })
          }, configuration.ping_interval_ms || 1800000) // Default 30 minutes.
        }
      }

    });

    // The pool will emit an enqueue event when a callback has been queued to wait for an available connection.
    this.pool.on('enqueue', () => {
      console.log('Waiting for available connection slot');
    });

    // The pool will emit a release event when a connection is released back to the pool.
    // This is called after all release activity has been performed on the connection, so the connection will be listed as free at the time of the event.
    this.pool.on('release', (connection) => {
      console.log('Connection %d released', connection.threadId);

      // Stop our ping.
      clearInterval(connection.ping_interval)
    });

    // TODO: Read the Server disconnects part and implement a way to handle disconnects from db.
    // TODO: Implement a ping?

    // connection.ping((err) => {
    //   if (err) throw err;
    //   console.log('Server responded to ping');
    // })

    // TODO: Review Error handling section on the mysql module.
  }

  async client(){
    return this.pool.getConnection()
  }

  async execute(script, variables){
    return {}
  }
}

module.exports = Mysql
