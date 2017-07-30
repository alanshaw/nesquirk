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
    const handle = new EventEmitter()

    handle.path = path
    handle.Collection = Collection
    handle.isReady = () => this._isReady(path, Collection)

    const onSubscriptionReady = (p, c) => {
      if (p === path && c === Collection) {
        this.removeListener('subscriptionready', onSubscriptionReady)
        handle.emit('ready')
      }
    }

    handle.stop = () => {
      this.removeListener('subscriptionready', onSubscriptionReady)
      this.unsubscribe(path, Collection)
    }

    this.on('subscriptionready', onSubscriptionReady)

    return handle
  }

  _retain (path, Collection, onReady) {
    this._subs[path] = this._subs[path] || []
    onReady = onReady || (() => 0)

    const subs = this._subs[path]
    const subIndex = subs.findIndex((s) => s.Collection === Collection)

    if (subIndex === -1) {
      const handler = this._createMessageHandler(path, Collection)

      subs.push({
        path,
        Collection,
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

    return this._createHandle(path, Collection)
  }

  _release (path, Collection) {
    const subs = this._subs[path]
    const subIndex = (subs || []).findIndex((s) => s.Collection === Collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${Collection.name}`)

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
      Collection.remove({ _id: { $in: removeIds } })
    }

    // Releasing last reference - unsubscribe from server
    // TODO: handle unsubscribe error
    this.nes.unsubscribe(path, sub.handler, (err) => {
      if (err) return console.error(`Failed to unsubscribe from ${path}`, err)
    })

    this._subs[path].splice(subIndex, 1)
  }

  _isReady (path, Collection) {
    const subs = this._subs[path] || []
    return subs.some((sub) => sub.Collection === Collection && sub.ready)
  }

  _onReady (path, Collection, data) {
    let onReadyHandlers = []

    const subIndex = (this._subs[path] || []).findIndex((s) => s.Collection === Collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${Collection.name}`)

    const sub = this._subs[path][subIndex]

    onReadyHandlers = sub.onReady

    const ids = new Set()

    if (data) {
      data = Array.isArray(data) ? data : [data]
      data.forEach((d) => {
        Collection.update({ _id: d._id }, { $set: d }, { upsert: true })
        ids.add(d._id)
      })
    }

    this._subs[path][subIndex] = { ...sub, ready: true, onReady: [], ids }
    onReadyHandlers.forEach((onReady) => onReady())
    this.emit('subscriptionready', path, Collection)
  }

  _onAdded (path, Collection, data) {
    if (!data) return

    const subIndex = (this._subs[path] || []).findIndex((s) => s.Collection === Collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${Collection.name}`)

    const sub = this._subs[path][subIndex]

    data = Array.isArray(data) ? data : [data]
    data.forEach((d) => {
      Collection.update({ _id: d._id }, { $set: d }, { upsert: true })
      sub.ids.add(d._id)
    })
  }

  _onUpdated (path, Collection, data) {
    if (!data) return

    const subIndex = (this._subs[path] || []).findIndex((s) => s.Collection === Collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${Collection.name}`)

    const sub = this._subs[path][subIndex]

    data = Array.isArray(data) ? data : [data]
    data.forEach((d) => {
      Collection.update({ _id: d._id }, { $set: d }, { upsert: true })
      sub.ids.add(d._id)
    })
  }

  _onRemoved (path, Collection, ids) {
    if (!ids) return
    ids = Array.isArray(ids) ? ids : [ids]
    if (!ids.length) return

    const subIndex = (this._subs[path] || []).findIndex((s) => s.Collection === Collection)
    if (subIndex === -1) return console.warn(`Subcription not exists ${path} for ${Collection.name}`)

    const sub = this._subs[path][subIndex]

    Collection.remove({ _id: { $in: ids } })
    ids.forEach((id) => sub.ids.delete(id))
  }
}

export default Client
