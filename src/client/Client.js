import { Client as NesClient } from 'nes'

class Client {
  constructor (url, opts) {
    this.nes = opts.client || new NesClient(url, opts)
    this._subs = {}
  }

  subscribe (path, Collection, cb) {
    return this._retain(path, Collection)
  }

  _isSubscribed (path, Collection) {
    const subs = this._subs[path] || []
    return subs.some((s) => s.Collection === Collection)
  }

  _createHandler (Collection) {
    const handler = () => null
    return handler
  }

  _retain (path, Collection) {
    this._subs[path] = this._subs[path] || []

    const subs = this._subs[path].slice()
    const subIndex = subs.findIndex((s) => s.Collection === Collection)
    let sub = subs[subIndex]

    if (subIndex === -1) {
      sub = {
        path,
        Collection,
        handler: this._createHandler(Collection),
        ready: false,
        count: 1
      }
      subs.push(sub)
    } else {
      sub = { ...sub, count: sub.count + 1 }
      subs[subIndex] = { ...sub, count: sub.count + 1 }
    }

    this._subs[path] = subs

    const handler = this._createHandler(Collection)

    this.nes.subscribe(path, handler, (err) => {
      if (err) return cb(err)
    })

    this._subs[path] = (this._subs[path] || []).map((sub) => {
      if (sub.Collection === Collection) {
        return { ...sub, count: sub.count + 1 }
      }
      return sub
    })

    return {
      isReady: () => this._isReady(path, Collection),
      stop: () => this.unsubscribe(path, Collection)
    }
  }

  _release (path, Collection) {
    this._subs[path] = (this._subs[path] || []).reduce((subs, sub) => {
      if (sub.Collection === Collection) {
        if (sub.count === 1) {
          // TODO: handle unsubscribe error
          this.nes.unsubscribe(path, sub.handler, (err) => {
            if (err) console.error(err)
          })
          return subs
        }
        return subs.concat({ ...sub, count: sub.count - 1 })
      }
      return subs.concat(sub)
    }, [])
  }

  _isReady (path, Collection) {
    const subs = this._subs[path] || []
    return subs.some((sub) => sub.Collection === Collection && sub.ready)
  }
}

export { Client }
