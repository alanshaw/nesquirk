const test = require('tape')
const Collection = require('../../lib/client/Collection').default

test('should emit change event on insert', (t) => {
  t.plan(1)

  const Items = new Collection('items')

  Items.on('change', () => {
    t.ok(true, 'change event emitted')
    t.end()
  })

  Items.insert({})
})

test('should emit change event on update', (t) => {
  t.plan(1)

  const Items = new Collection('items')

  const itemId = Items.insert({})

  Items.on('change', () => {
    t.ok(true, 'change event emitted')
    t.end()
  })

  Items.update({ _id: itemId }, { $set: { foo: 'bar' } })
})

test('should emit change event on remove', (t) => {
  t.plan(1)

  const Items = new Collection('items')

  const itemId = Items.insert({})

  Items.on('change', () => {
    t.ok(true, 'change event emitted')
    t.end()
  })

  Items.remove({ _id: itemId })
})

test('should create _id and return on insert', (t) => {
  t.plan(3)

  const Items = new Collection('items')

  const timestamp = Date.now()
  const itemId = Items.insert({ timestamp })
  const item = Items.find({ _id: itemId }).first()

  t.ok(itemId, '_id was returned')
  t.equal(item._id, itemId, '_id field added to document')
  t.equal(item.timestamp, timestamp, '_id given to correct document')
  t.end()
})

test('should support update with $set', (t) => {
  t.plan(2)

  const Items = new Collection('items')

  const now = Date.now()
  const then = now - Math.round(Math.random() * 100)
  const itemId = Items.insert({ timestamp: then })

  let item = Items.find({ _id: itemId }).first()

  t.equal(item.timestamp, then, 'item has old timestamp')

  Items.update({ _id: itemId }, { $set: { timestamp: now } })

  item = Items.find({ _id: itemId }).first()

  t.equal(item.timestamp, now, 'item has new timestamp')
  t.end()
})

test('should support update with $set on single document', (t) => {
  t.plan(3)

  const Items = new Collection('items')

  const now = Date.now()

  Items.insert({ type: 'rubber', timestamp: now - Math.round(Math.random() * 100) })
  Items.insert({ type: 'rubber', timestamp: now - Math.round(Math.random() * 100) })

  Items.find({ type: 'rubber' }).forEach((item, i) => {
    t.notEqual(item.timestamp, now, `item ${i} has old timestamp`)
  })

  Items.update({ type: 'rubber' }, { $set: { timestamp: now } }, { multi: false })

  const items = Items.find({ type: 'rubber' }).all()

  t.equal(items.filter((i) => i.timestamp === now).length, 1, 'only one matching document updated')
  t.end()
})

test('should support update with $set on multiple documents', (t) => {
  t.plan(3)

  const Items = new Collection('items')

  const now = Date.now()

  Items.insert({ type: 'rubber', timestamp: now - Math.round(Math.random() * 100) })
  Items.insert({ type: 'rubber', timestamp: now - Math.round(Math.random() * 100) })

  Items.find({ type: 'rubber' }).forEach((item, i) => {
    t.notEqual(item.timestamp, now, `item ${i} has old timestamp`)
  })

  Items.update({ type: 'rubber' }, { $set: { timestamp: now } }, { multi: true })

  const items = Items.find({ type: 'rubber' }).all()

  t.ok(items.every((i) => i.timestamp === now), 'every matching document updated')
  t.end()
})

test('should support update with $set and upsert', (t) => {
  t.plan(2)

  const Items = new Collection('items')

  t.equal(Items.find({ type: 'rubber' }).count(), 0, 'no documents matching')

  Items.update({ type: 'rubber' }, { $set: { type: 'rubber' } }, { upsert: true })

  t.equal(Items.find({ type: 'rubber' }).count(), 1, 'document upserted')
  t.end()
})

test('should support update with $set and nested properties', (t) => {
  t.plan(1)

  const Items = new Collection('items')

  const now = Date.now()
  const then = now - Math.round(Math.random() * 100)

  const itemId = Items.insert({ path: { to: { timestamp: then } } })

  Items.update({ _id: itemId }, { $set: { 'path.to.timestamp': now } })

  const item = Items.find({ _id: itemId }).first()

  t.equal(item.path.to.timestamp, now, 'document updated')
  t.end()
})

test('should support update with $set and upsert and nested properties', (t) => {
  t.plan(1)

  const Items = new Collection('items')

  const now = Date.now()

  Items.update({}, { $set: { 'path.to.timestamp': now } }, { upsert: true })

  const item = Items.find({}).first()

  t.equal(item.path.to.timestamp, now, 'document upserted')
  t.end()
})
