import EJSON from 'ejson'

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

  _stringifyObjectIds (data) {
    return Array.isArray(data)
      ? data.map((d) => d && d._id ? { ...d, _id: d._id.toString() } : d)
      : data && data._id ? { ...data, _id: data._id.toString() } : data
  }

  add (path, data = [], opts) {
    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'added', data }, opts)
  }

  update (path, data = [], opts) {
    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'updated', data }, opts)
  }

  remove (path, data = [], opts) {
    data = EJSON.stringify(this._stringifyObjectIds(data))
    this._server.publish(path, { msg: 'removed', data }, opts)
  }
}
