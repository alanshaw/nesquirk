import EJSON from 'ejson'

const filterYes = (path, message, options, next) => next(true)

export class Server {
  constructor (server) {
    this._server = server
  }

  subscription (path, opts, onSubscribe) {
    if (!onSubscribe) {
      onSubscribe = opts
      opts = {}
    }

    opts = opts || {}

    const _onSubscribe = opts.onSubscribe || ((socket, path, params, next) => next())

    opts.onSubscribe = (socket, path, params, next) => {
      // console.log('onSubscribe', path, params)

      _onSubscribe(socket, path, params, (err) => {
        if (err) return next(err)

        const onReady = (err, data) => {
          if (err && err instanceof Error) return next(err)
          data = EJSON.stringify(this._stringifyObjectIds(err || data || []))
          socket.publish(path, { msg: 'ready', data }, next)
        }

        if (onSubscribe) {
          onSubscribe(socket, path, params, onReady)
        } else {
          onReady()
        }
      })
    }

    opts.filter = this._createFilter(opts.filter)

    this._server.subscription(path, opts)

    return this
  }

  _createFilter (filter) {
    if (typeof filter === 'function') return filter

    filter = ['ready', 'added', 'updated', 'removed'].reduce((f, type) => {
      f[type] = (filter && filter[type]) || filterYes
      return f
    }, {})

    return (path, message, options, next) => {
      filter[message.msg](path, message.data, options, next)
    }
  }

  _stringifyObjectIds (data) {
    return Array.isArray(data)
      ? data.map((d) => d && d._id ? { ...d, _id: d._id.toString() } : d)
      : data && data._id ? { ...data, _id: data._id.toString() } : data
  }

  add (path, data = [], opts) {
    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'added', data }, opts)
    return this
  }

  update (path, data = [], opts) {
    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'updated', data }, opts)
    return this
  }

  remove (path, ids = [], opts) {
    ids = Array.isArray(ids) ? ids.map((id) => id.toString()) : ids.toString()
    const data = EJSON.stringify(ids)
    this._server.publish(path, { msg: 'removed', data }, opts)
    return this
  }
}
