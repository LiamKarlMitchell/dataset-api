const EventEmitter = require('events')
const Exceptions = require('./exceptions')

// TODO: Do extra logic here on events occured. Notice connection about it, it will be logged or prompted for critical update on situation.
// NOTE: Note that this.connected is checked for connection, if false. No action will be performed with this connection :)

class Connection{
  constructor(){
    // this.agent = null
    this.connected = false // TODO: Make connected a property.
    this.operator = new EventEmitter

    this.timedout_count = 0

    this.setup()
  }

  setup(){
    this.operator.on('connect', () => {
      this.connected = true
      this.timedout = 0
    })

    this.operator.on('disconnect', () => {
      this.connected = false
    })

    this.operator.on('timeout', () => {
      if(++this.timedout_count === 3){
        this.connected = false
      }
    })

    this.operator.on('error', (e, close) => {
      console.log('operator calls error exception:', e)

      if(close){
        this.operator.emit('disconnect')
      }
    })

    //connect()
  }

// TODO: Implement connect as an async method so we can reconnect and also attempt connect on startup?
  //async connect(){
//    throw new Exceptions.CONNECTION_ERROR("Driver '" + this + "' should implement it's own connect method.")
//  }

  async client(){
    throw new Exceptions.UNDEFINED_METHOD('`async` connection.client(script, variables)', __filename.replace(process.cwd(), ''))
  }

  /*
  Used to execute query files, without middleware.
   */
  async execute(script, variables){
    throw new Exceptions.UNDEFINED_METHOD('`async` connection.execute(script, variables)', __filename.replace(process.cwd(), ''))
  }
}

module.exports = Connection
