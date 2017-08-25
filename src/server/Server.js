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
      filter[message.msg](path, options.internal.__data, options, (isMatch, override) => {
        if (!isMatch) return next(false, override)
        if (override === undefined) return next(true)

        // Otherwise we have to clone the message and stringify the overridden data
        const msg = { ...message }

        if (message.msg === 'removed') {
          override = Array.isArray(override)
            ? override.map((id) => id.toString())
            : override.toString()
        } else {
          override = this._stringifyObjectIds(override)
        }

        msg.data = EJSON.stringify(override)

        next(true, msg)
      })
    }
  }

  _stringifyObjectIds (data) {
    return Array.isArray(data)
      ? data.map((d) => d && d._id ? { ...d, _id: d._id.toString() } : d)
      : data && data._id ? { ...data, _id: data._id.toString() } : data
  }

  add (path, data = [], opts) {
    opts = opts || {}
    opts.internal = opts.internal || {}
    opts.internal.__data = data

    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'added', data }, opts)

    return this
  }

  update (path, data = [], opts) {
    opts = opts || {}
    opts.internal = opts.internal || {}
    opts.internal.__data = data

    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'updated', data }, opts)

    return this
  }

  remove (path, ids = [], opts) {
    opts = opts || {}
    opts.internal = opts.internal || {}
    opts.internal.__data = ids

    ids = Array.isArray(ids) ? ids.map((id) => id.toString()) : ids.toString()
    const data = EJSON.stringify(ids)
    this._server.publish(path, { msg: 'removed', data }, opts)

    return this
  }
}
