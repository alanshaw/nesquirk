const Path = require('path')
const Hapi = require('hapi')
const Mes = require('../../lib/server')

const server = new Hapi.Server()

server.connection({
  host: 'localhost',
  port: 3000
})

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: Path.join(__dirname, 'public'),
      redirectToSlash: true,
      index: true
    }
  }
})

server.register([Inert, Mes], (err) => {
  if (err) throw err

  server.start((err) => {
    if (err) throw err
    console.log('Server running at:', server.info.uri);
  })
})
