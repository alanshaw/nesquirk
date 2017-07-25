import Mingo from 'mingo'
import ObjectID from 'bson-objectid'
import EJSON from 'ejson'
import { EventEmitter } from 'events'

class Collection extends EventEmitter {
  constructor (name) {
    super()
    this.name = name
    this._docs = []
  }

  find (criteria, projection) {
    return Mingo.find(this._docs, criteria, projection)
  }

  insert (doc) {
    // console.log('Insert', doc)
    doc = EJSON.clone(doc)
    doc._id = doc._id || ObjectID().toHexString()
    this._docs.push(doc)
    this.emit('change')
    return doc._id
  }

  update (criteria, update, options) {
    options = options || {}

    const modifiers = Object.keys(update)

    if (modifiers.length > 1 || modifiers[0] !== '$set') {
      throw new Error(`Unsupported modifier(s) ${modifiers.filter((m) => m !== '$set')}`)
    }

    const upsert = options.upsert || false
    const multi = options.multi || false

    let nMatched = 0
    let nUpserted = 0
    let nModified = 0

    const cursor = Mingo.find(this._docs, criteria)
    nMatched = cursor.count()

    if (nMatched) {
      const updateDoc = (doc) => {
        const index = this._docs.findIndex((d) => d._id === doc._id)
        this._docs[index] = { ...EJSON.clone(doc), ...update.$set }
      }

      if (multi) {
        cursor.forEach(updateDoc)
        nModified = nMatched
      } else {
        updateDoc(cursor.first())
        nModified = 1
      }
    } else {
      if (upsert) {
        // console.log('Upsert', update.$set)
        this.insert(update.$set)
        nUpserted = 1
      }
    }

    this.emit('change')
    return { nMatched, nModified, nUpserted }
  }

  remove (criteria) {
    const docs = Mingo.remove(this._docs, criteria)
    const nRemoved = this._docs.length - docs.length
    this._docs = docs
    this.emit('change')
    return { nRemoved }
  }

  aggregate (expressions) {
    return Mingo.aggregate(this._docs, expressions)
  }
}

export default Collection
