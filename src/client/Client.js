import { Client as NesClient } from 'nes'
import EJSON from 'ejson'
import EventEmitter from 'events'

const MSG_TYPES = ['ready', 'added', 'updated', 'removed']

class Client extends EventEmitter {
  constructor (url, opts) {
    super()
    opts = opts || {}
    this.nes = opts.client || new NesClient(url, opts)
    this._subs = {}
    this.setMaxListeners(Infinity)
  }

  connect () {
    return this.nes.connect.apply(this.nes, arguments)
  }

  request () {
    return this.nes.request.apply(this.nes, arguments)
  }

  subscribe (path, collection, onReady) {
    return this._retain(path, collection, onReady)
  }

  unsubscribe (path, collection) {
    return this._release(path, collection)
  }

  subscriptions () {
    return Object.keys(this._subs)
  }

  _createMessageHandler (path, collection) {
    return (message, flags) => {
      const msgType = message.msg
      if (!MSG_TYPES.includes(msgType)) return console.warn(`Invalid message type ${msgType}`)
      const method = `_on${msgType[0].toUpperCase() + msgType.slice(1)}`
      this[method](path, collection, EJSON.parse(message.data))
    }
  }

  _createHandle (path, collection) {
    const handle = new EventEmitter()

    handle.path = path
    handle.collection = collection
    handle.isReady = () => this._isReady(path, collection)

    const onSubscriptionReady = (p, c) => {
      if (p === path && c === collection) {
        this.removeListener('subscriptionready', onSubscriptionReady)
        handle.emit('ready')
      }
    }

    handle.stop = () => {
      this.removeListener('subscriptionready', onSubscriptionReady)
      this.unsubscribe(path, collection)
    }

    this.on('subscriptionready', onSubscriptionReady)

    return handle
  }

  _retain (path, collection, onReady) {
    this._subs[path] = this._subs[path] || []
    onReady = onReady || (() => 0)

    const subs = this._subs[path]
    const subIndex = subs.findIndex((s) => s.collection === collection)

    if (subIndex === -1) {
      const handler = this._createMessageHandler(path, collection)

      subs.push({
        path,
        collection,
        handler,
        ready: false,
        onReady: onReady ? [onReady] : [],
        count: 1,
        ids: new Set()
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

    return this._createHandle(path, collection)
  }

  _release (path, collection) {
    const subs = this._subs[path]
    const subIndex = (subs || []).findIndex((s) => s.collection === collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${collection.name}`)

    const sub = this._subs[path][subIndex]

    // More than one reference remains
    if (sub.count > 1) {
      sub.count--
      return
    }

    const removeIds = []

    // Releasing last reference - remove unused docs
    sub.ids.forEach((id) => {
      const hasRef = subs.some((s) => s !== sub && sub.ids.has(id))
      if (!hasRef) removeIds.push(id)
    })

    if (removeIds.length) {
      collection.remove({ _id: { $in: removeIds } })
    }

    // Releasing last reference - unsubscribe from server
    // TODO: handle unsubscribe error
    this.nes.unsubscribe(path, sub.handler, (err) => {
      if (err) return console.error(`Failed to unsubscribe from ${path}`, err)
    })

    this._subs[path].splice(subIndex, 1)
  }

  _isReady (path, collection) {
    const subs = this._subs[path] || []
    return subs.some((sub) => sub.collection === collection && sub.ready)
  }

  _onReady (path, collection, data) {
    let onReadyHandlers = []

    const subIndex = (this._subs[path] || []).findIndex((s) => s.collection === collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${collection.name}`)

    const sub = this._subs[path][subIndex]

    onReadyHandlers = sub.onReady

    const ids = new Set()

    if (data) {
      data = Array.isArray(data) ? data : [data]
      data.forEach((d) => {
        collection.update({ _id: d._id }, { $set: d }, { upsert: true })
        ids.add(d._id)
      })
    }

    this._subs[path][subIndex] = { ...sub, ready: true, onReady: [], ids }
    onReadyHandlers.forEach((onReady) => onReady())
    this.emit('subscriptionready', path, collection)
  }

  _onAdded (path, collection, data) {
    if (!data) return

    const subIndex = (this._subs[path] || []).findIndex((s) => s.collection === collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${collection.name}`)

    const sub = this._subs[path][subIndex]

    data = Array.isArray(data) ? data : [data]
    data.forEach((d) => {
      collection.update({ _id: d._id }, { $set: d }, { upsert: true })
      sub.ids.add(d._id)
    })
  }

  _onUpdated (path, collection, data) {
    if (!data) return

    const subIndex = (this._subs[path] || []).findIndex((s) => s.collection === collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${collection.name}`)

    const sub = this._subs[path][subIndex]

    data = Array.isArray(data) ? data : [data]
    data.forEach((d) => {
      collection.update({ _id: d._id }, { $set: d }, { upsert: true })
      sub.ids.add(d._id)
    })
  }

  _onRemoved (path, collection, ids) {
    if (!ids) return
    ids = Array.isArray(ids) ? ids : [ids]
    if (!ids.length) return

    const subIndex = (this._subs[path] || []).findIndex((s) => s.collection === collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${collection.name}`)

    const sub = this._subs[path][subIndex]

    collection.remove({ _id: { $in: ids } })
    ids.forEach((id) => sub.ids.delete(id))
  }
}

export default Client
