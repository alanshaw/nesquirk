const Path = require('path')
const Hapi = require('hapi')
const Inert = require('inert')
const mongojs = require('mongojs')
const { ObjectId } = mongojs
const _ = require('lodash')
const Nesquirk = require('nesquirk')

const server = new Hapi.Server()
const db = mongojs('todo', ['todos'])

server.connection({ host: 'localhost', port: 3000 })

server.register([Inert, Nesquirk], (err) => {
  if (err) throw err

  server.nq
    .subscription('/todos', (socket, path, params, reply) => {
      db.todos.find({}, { _id: 1, title: 1, createdAt: 1, done: 1 }, reply)
    })
    .subscription('/todo/{todoId}', (socket, path, { todoId }, reply) => {
      db.todos.findOne({ _id: ObjectId(todoId) }, reply)
    })

  // Add
  server.route({
    method: 'POST',
    path: '/todo',
    handler (request, reply) {
      const data = Object.assign(
        _.pick(request.payload, ['title', 'description']),
        { done: false, createdAt: new Date() }
      )

      db.todos.insert(data, (err, todo) => {
        if (err) return reply(err)
        server.nq.add('/todos', todo)
        reply(todo)
      })
    }
  })

  // Edit
  server.route({
    method: 'PATCH',
    path: '/todo/{todoId}',
    handler (request, reply) {
      const todoId = ObjectId(request.params.todoId)
      const data = _.pick(request.payload, ['title', 'description', 'done'])

      db.todos.update({ _id: todoId }, { $set: data }, (err) => {
        if (err) return reply(err)
        db.todos.findOne({ _id: todoId }, (err, todo) => {
          if (err) return reply(err)
          server.nq
            .update('/todos', todo)
            .update(`/todo/${todoId}`, todo)
          reply(todo)
        })
      })
    }
  })

  // Remove
  server.route({
    method: 'DELETE',
    path: '/todo/{todoId}',
    handler (request, reply) {
      const todoId = ObjectId(request.params.todoId)

      db.todos.remove({ _id: todoId }, (err) => {
        if (err) return reply(err)
        server.nq
          .remove('/todos', todoId)
          .remove(`/todo/${todoId}`, todoId)
        reply().code(204)
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
