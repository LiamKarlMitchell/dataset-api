const Connection = require('../system/connection.js')
const promise = require('bluebird') // or any other Promise/A+ compatible library

// See also: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
class Pgsql extends Connection{

  constructor(configuration){
    super()

    // TODO: Allow configuration of init options?
    const initOptions = {
      promiseLib: promise // overriding the default (ES6 Promise)
    }

    var pgp = require('pg-promise')(initOptions)

    if (configuration.monitor == true) {
      const monitor = require('pg-monitor')
      try {
          monitor.attach(initOptions) // attach to all events at once
      } catch (e) {
        // We don't care, this monitor is just for debug purposes?
      }
    }

    // TODO: Consider a way to configure these...
    // Note: Conversions such as these may have loss of precision or errors.
    // Convert bigserial + bigint (both with typeId = 20) to integer: (Note: Should add a big integer class if we need to do this...)
    pgp.pg.types.setTypeParser(20, parseInt) // int8
    pgp.pg.types.setTypeParser(21, parseInt) // int2
    pgp.pg.types.setTypeParser(23, parseInt) // int4
    pgp.pg.types.setTypeParser(700, parseFloat) // float4
    pgp.pg.types.setTypeParser(701, parseFloat) // float8
    pgp.pg.types.setTypeParser(1700, parseFloat) // numeric

    this.pgp = pgp
  }

  async client(){
    return this.pgp
  }

}

module.exports = Pgsql
