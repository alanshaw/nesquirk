const Path = require('path')
const Hapi = require('hapi')
const Inert = require('inert')
const mongojs = require('mongojs')
const ObjectId = mongojs.ObjectId
const Mes = require('../../lib/server')

const server = new Hapi.Server()
const db = mongojs('todo', ['todos'])

server.connection({
  host: 'localhost',
  port: 3000
})

server.register([Inert, Mes], (err) => {
  if (err) throw err

  server.mes.subscription('/todos', (reply) => {
    db.todos.find({}, { _id: 1, title: 1, createdAt: 1, done: 1 }, reply)
  })

  server.mes.subscription('/todo/{id}', ({ id }, reply) => {
    db.todos.findOne({ _id: ObjectId(id) }, reply)
  })

  // Add
  server.route({
    method: 'POST',
    path: '/todo',
    handler (request, reply) {
      db.todos.insert({
        title: request.payload.title || '',
        description: request.payload.description || '',
        done: false,
        createdAt: new Date()
      }, (err, todo) => {
        if (err) return reply(err)
        server.mes.add('/todos', todo)
        reply(todo)
      })
    }
  })

  // Edit
  server.route({
    method: 'PATCH',
    path: '/todo/{id}',
    handler (request, reply) {
      const $set = {}

      if (request.payload.title != null) $set.title = request.payload.title
      if (request.payload.description != null) $set.description = request.payload.description
      if (request.payload.done != null) $set.done = request.payload.done

      db.todos.update({ _id: ObjectId(request.params.id) }, { $set }, (err) => {
        if (err) return reply(err)
        db.todos.findOne({ _id: ObjectId(request.params.id) }, (err, todo) => {
          if (err) return reply(err)
          server.mes.update('/todos', todo)
          server.mes.update(`/todo/${request.params.id}`, todo)
          reply(todo)
        })
      })
    }
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

  server.start((err) => {
    if (err) throw err
    console.log('Server running at:', server.info.uri)
  })
})
