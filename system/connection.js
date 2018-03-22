const EventEmitter = require('events')

// TODO: Do extra logic here on events occured. Notice connection about it, it will be logged or prompted for critical update on situation.
// NOTE: Note that this.connected is checked for connection, if false. No action will be performed with this connection :)

class Connection{
  constructor(){
    this.agent = null
    this.connected = false
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
  }

  async client(){
    console.log('default `get` for connection client')

    return null
  }
}

module.exports = Connection
