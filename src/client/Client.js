import { Client as NesClient } from 'nes'
import EJSON from 'ejson'

const MSG_TYPES = ['ready', 'added', 'updated', 'deleted']

class Client {
  constructor (url, opts) {
    opts = opts || {}
    this.nes = opts.client || new NesClient(url, opts)
    this._subs = {}
  }

  connect () {
    return this.nes.connect.apply(this.nes, arguments)
  }

  request () {
    return this.nes.request.apply(this.nes, arguments)
  }

  subscribe (path, Collection, onReady) {
    return this._retain(path, Collection, onReady)
  }

  unsubscribe (path, Collection) {
    return this._release(path, Collection)
  }

  subscriptions () {
    return Object.keys(this._subs)
  }

  _createMessageHandler (path, Collection) {
    return (message, flags) => {
      const msgType = message.msg
      if (!MSG_TYPES.includes(msgType)) return console.warn(`Invalid message type ${msgType}`)
      const method = `_on${msgType[0].toUpperCase() + msgType.slice(1)}`
      this[method](path, Collection, EJSON.parse(message.data))
    }
  }

  _createHandle (path, Collection) {
    return {
      path,
      Collection,
      isReady: () => this._isReady(path, Collection),
      stop: () => this.unsubscribe(path, Collection)
    }
  }

  _retain (path, Collection, onReady) {
    this._subs[path] = this._subs[path] || []
    onReady = onReady || (() => 0)

    const subs = Array.from(this._subs[path])
    const subIndex = subs.findIndex((s) => s.Collection === Collection)

    if (subIndex === -1) {
      const handler = this._createMessageHandler(path, Collection)

      subs.push({
        path,
        Collection,
        handler,
        ready: false,
        onReady: onReady ? [onReady] : [],
        count: 1
      })

      // TODO: handle subscribe error
      this.nes.subscribe(path, handler, (err) => {
        if (err) return console.error(`Failed to subscribe to ${path}`, err)
      })
    } else {
      let sub = { ...subs[subIndex], count: subs[subIndex].count + 1 }

      if (sub.ready) {
        setTimeout(onReady)
      } else {
        sub.onReady = sub.onReady.concat(onReady)
      }

      subs[subIndex] = sub
    }

    this._subs[path] = subs

    return this._createHandle(path, Collection)
  }

  _release (path, Collection) {
    this._subs[path] = (this._subs[path] || []).reduce((subs, sub) => {
      if (sub.Collection !== Collection) return subs.concat(sub)

      // More than one reference remains
      if (sub.count > 1) return subs.concat({ ...sub, count: sub.count - 1 })

      // Releasing last reference - unsubscribe from server
      // TODO: handle unsubscribe error
      this.nes.unsubscribe(path, sub.handler, (err) => {
        if (err) return console.error(`Failed to unsubscribe from ${path}`, err)
      })

      return subs
    }, [])
  }

  _isReady (path, Collection) {
    const subs = this._subs[path] || []
    return subs.some((sub) => sub.Collection === Collection && sub.ready)
  }

  _onReady (path, Collection, data) {
    let onReadyHandlers = []

    this._subs[path] = (this._subs[path] || []).map((sub) => {
      if (sub.Collection !== Collection) return sub
      onReadyHandlers = sub.onReady
      return { ...sub, ready: true, onReady: [] }
    })

    if (data) {
      data = Array.isArray(data) ? data : [data]
      data.forEach((d) => Collection.update({ _id: d._id }, { $set: d }, { upsert: true }))
    }

    onReadyHandlers.forEach((onReady) => onReady())
  }

  _onAdded (path, Collection, data) {
    if (!data) return
    data = Array.isArray(data) ? data : [data]
    data.forEach((d) => Collection.update({ _id: d._id }, { $set: d }, { upsert: true }))
  }

  _onUpdated (path, Collection, data) {
    if (!data) return
    data = Array.isArray(data) ? data : [data]
    data.forEach((d) => Collection.update({ _id: d._id }, { $set: d }, { upsert: true }))
  }

  _onRemoved (path, Collection, data) {
    if (!data) return
    data = Array.isArray(data) ? data : [data]
    if (!data.length) return
    Collection.remove({ _id: { $in: data.map((d) => d._id) } })
  }
}

export default Client
