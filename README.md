# Dataset Restful API

How simple can it be? Just clone, configure. Add routes, access, connections, storage and anything you need. And it shall be working.

## Versioning

Create new `folder` in `dataset` directory. Your `folder` is version parameter for API Router on route `/api/:version`.
Create `synopsis.yaml` inside `dataset/{folder}`.

## Synopsis.yaml

Synopsis describes your routes, validation and or middleware. A route can have `simple query` or `middleware`. Query always comes first when checking.

Everything is optional, apart from:

`middleware` or `query`, one of them must be mentioned in route definition. Anything apart is just an example of what it is capable of.

Full example:
```yaml
GET /user/create/sql:
  query:
    connection: test
    script: /user.create.sql
  validation:
    schema: /v1/user.create.js
    email:
      required: true
      match: test@gmail.com
    name:
      required: true
    password:
      required: true
      length:
        min: 4
        max: 16
  access: default

  # Server request settings cache
  request:
    cache:
      enabled: true
      ttl: 3600
      driver: simple

  # Destination headers settings cache
  response:
    cache:
      enabled: true
      ttl: 3600
    headers:
      cache-control: 'public, max-age=31557600'
      pragma: 'no-cache'
      expires: 0

GET /user/create/middleware:
  middleware: /user.create.js
  validation:
    schema: /v1/user.create.js
```

## Creating simple sql query

Create `query.sql` in your version `folder`.

Mention `query.sql` in your `synopsis.yaml` route like this:

```yaml
GET /example/route:
  query:
    script: /query.sql
    connection: yourconnection
```

If no connection is defined, then `config/default.yaml` `connection` is used. If no connection, error is thrown and aborts request.

## Adding simple middleware

Create `middleware.js` in your version `folder`.

Add to your exports this:

```js
module.exports.middleware = async (request, response, next) => {
  let result = {}

  // Gather result, use Connections, for fetching client and performing action etc.
  // Get results from other website maybe?

  return result
}
```

```yaml
GET /example/route:
  middleware: /middleware.js
```

## Adding connection

Open `config/connection.yaml` and add your connection.

```yaml
yourconnection:
  # Settings passed down to driver
  driver: mysql # /connection/{driver}.js
  connectionLimit: 10
  host: 'localhost'
  user: 'root'
  password: ''
  database: 'database'
```

Each driver has its own requirements/set of settings to use. For more details visit <blahblah>.
To get the connection in middleware use:

```js

const Connections = require('../system/connections.js')

let connection = Connections.get('yourconnection')

let client = await connection.client()

// Perform action, then release client etc. whatever it requires.

```

Read up more on supported `connection drivers` here.

## Creating access keys for authorized access

In `config/access.yaml` add:

```yaml
youraccess:
  # Settings passed down to driver `configuration`
  key: debug-key
  driver: yourdriver # This driver name requires `access/yourdriver.js`. `simple` would require `access/simple.js`
```

## Adding access driver

Create `yourdriver`.js in `access` directory. Export class with `middleware` function like this:

```js
class Simple{
  constructor(configuration){
    this.key = configuration.key
  }

  middleware(request, response, next){
    let authorization = request.headers.authorization

    if(authorization !== this.key){
      throw new Exceptions.BAD_AUTHORIZATION
    }

    next()
  }
}

module.exports = Simple
```

## Adding own connection driver

Create `mydriver.js` in `connection` directory.
Export driver constructor using `module.exports = yourclassconstructor`.

```js
const Connection = require('../system/connection.js')

class Mydriver extends Connection{

  constructor(configuration){
    super()

    /*

    /\
    ||
    ________________________________

    Your driver pool/connection etc.
    See other drivers for example.
    ________________________________
    ||
    \/

     */
  }

  async client(){
    return this.pool.request()
  }

}

module.exports = Mydriver
```

Constructor will then be initiated using configuration from `config/connection.yaml` to `Connections`.


## Creating middleware

Create `file.js` in your version `folder`.

Mention `file.js` in your `synopsis.yaml` middleware.

```yaml
GET /example/route:
  middleware: /file.js
```

## Creating schema validation

In your `synopsis.yaml` use option `validation`.`schema`, for a route so their form input will be validated against that.

Its using `jsonschema` module. Thanks @whoevermade that. For more information about schema, find on their website.
Just one difference is when requiring dependencies, use require. And `module.exports` for easier schema reconstruction.

```yaml
GET /example/route:
  middleware: /file.js

  # ...
  validation:
    schema: /version/validation.js
  # ...
```

## Using Logger

Logger driver to use is defined in `config/default.yaml`.`logger`.`driver`.

```js
const Logger = require('../system/logger.js')

Logger.log('Hey, its my `log` function')
Logger.debug('Hey, its my `debug` function')
Logger.trace('Hey, its my `trace` function')
Logger.warn('Hey, its my `warn` function')
Logger.error('Hey, its my `error` function')
Logger.fatal('Hey, its my `fatal` function')

```

## Create own Logger driver

Create `mylogger`.js in `logger` directory. Export your extension class of Logger class with `module.exports` and make sure to override interface `system/logger.js` functions! Otherwise it will throw exception error.

```js
const util = require('util')
const Logger = require('../system/logger.js').class

class MyLogger extends Logger{
  constructor(){
    super()
  }

  log(){
    console.log('\x1b[35mLOG:\x1b[0m', util.format.apply(null, arguments))
  }

  debug(){
    console.log('\x1b[35mDEBUG:\x1b[0m', util.format.apply(null, arguments))
  }

  trace(){
    console.log('\x1b[35mTRACE:\x1b[0m', util.format.apply(null, arguments))
  }

  warn(){
    console.log('\x1b[35mWARN:\x1b[0m', util.format.apply(null, arguments))
  }

  error(){
    console.log('\x1b[35mERROR:\x1b[0m', util.format.apply(null, arguments))
  }

  fatal(){
    console.log('\x1b[35mFATAL:\x1b[0m', util.format.apply(null, arguments))
  }
}

module.exports = MyLogger
```

## Cloning

Clone with working example routes (learning)

`clone instruction here, to clone with example`

Or, clone it clean (advanced)

`clone instructions here, to clone raw`

## Feature list
1. Supported `GET`, `POST`, `PATCH`, `DELETE`, `PUT` HTTP methods.
2. SSL (coming soon)
3. Any access driver (simple, oauth2, facebook, googleplus) or add your own
4. Any storage driver (simple, redis) or add your own
5. Any connection driver (mysql, postgres, mongo, mssql) or add your own
6. Schema validation of form input
7. Versioning of API's `v1`, `v2`, `v3` etc.
8. Any logging driver (simple, pino, bunyan, winston) or add your own
9. Cli, for helping out! And remote control using access driver (coming soon)

## Best practices

1. Route method for purpose
2.

and some others, pretty sure we can add more here!
