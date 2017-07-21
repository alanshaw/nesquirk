import EJSON from 'ejson'

export class Server {
  constructor (server) {
    this._server = server
  }

  subscription (path, opts, onSubscribe) {
    if (!onSubscribe) {
      opts = onSubscribe
      opts = {}
    }

    opts = opts || {}

    const _onSubscribe = opts.onSubscribe || ((socket, path, params, next) => next())

    opts.onSubscribe = (socket, path, params, next) => {
      _onSubscribe(socket, path, params, (err) => {
        if (err) return next(err)

        const onReady = (err) => {
          if (err && err instanceof Error) return next(err)
          const data = EJSON.stringify(err || [])
          socket.publish(path, { msg: 'ready', data }, next)
        }

        if (!onSubscribe) return onReady()

        if (Object.keys(params).length) {
          onSubscribe(params, onReady)
        } else {
          onSubscribe(onReady)
        }
      })
    }

    this._server.subscription(path, opts)
  }

  add (path, data = [], opts) {
    data = EJSON.stringify(data)
    this._server.publish(path, { msg: 'added', data }, opts)
  }

  update (path, data = [], opts) {
    data = EJSON.stringify(data)
    this._server.publish(path, { msg: 'updated', data }, opts)
  }

  remove (path, data = [], opts) {
    data = EJSON.stringify(data)
    this._server.publish(path, { msg: 'removed', data }, opts)
  }
}
