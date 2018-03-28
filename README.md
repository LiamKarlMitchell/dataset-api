# Dataset Restful API

How simple can it be? Just clone, configure. Add routes, access, connections, storage and anything you need. And it shall be working.

## Versioning

Create new `folder` in `dataset` directory. Your `folder` is version parameter for API Router on route `/api/:version`.
Create `synopsis.yaml` inside `dataset/{folder}`.

## Synopsis.yaml

Synopsis describes your routes, validation and or middleware.

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
  # access: default

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
    script: /file.js
    connection: yourconnection
```

## Adding connection

Open `config/connection.yaml` and add your connection.

```yaml
yourconnection:
  driver: mysql # /connection/{driver}.js

  # Driver specific settings:
  connectionLimit: 10
  host: 'localhost'
  user: 'root'
  password: ''
  database: 'database'
```

Each driver has its own requirements/set of settings to use. For more details visit <blahblah>.

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

## Cloning

Clone with working example routes (learning)

`clone instruction here, to clone with example`

Or, clone it clean (advanced)

`clone instructions here, to clone raw`

## Best practices

1. Route method for purpose

and some others, pretty sure we can add more here!
