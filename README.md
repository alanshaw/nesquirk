# Mes

Ties Nes + minimongo together for gloryful reactive apps.


## Server

```js
// opts are Nes server.subscription options
server.mes.subscription('/item/{_id}', opts, (reply) => {
  // Get your initial object, reply(obj)
})
// Behind the scenes, the callback is attached to opts.onSubscribe
// We call socket.send for sending results, and then next
```

### Managing the subscription

We don't keep subscription documents in memory, so you have to maintain your subscriptions.

```js
// Single item (_id) must be in the url, or in the update obj to work
server.mes.update('/item/{_id}', { _id: 5, status: 'complete' })

// Multiple items
server.mes.add('/items', { _id: 5, status: 'complete' }) // alias for update?
server.mes.add('/items', [/* ... */]) // Also pass arrays here
server.mes.update('/items', { _id: 5, status: 'complete' }) // Note: needs _id in object(s) to merge
server.mes.remove('/items', { _id: 5 }) // Note: needs _id in object(s) to delete
```

## Client

```js
const Mes = require('mes')
const client = new Mes.Client('ws://localhost')

// A minimongo collection
const Items = Mes.collection('items')

client.connect((err) => {
  // Hook the '/item/5' publication up to the Items collection
  const handle = client.subscribe('/item/5', Items, (err) => console.log('Ready or error'))

  // Stop
  handle.stop() // or
  client.unsubscribe('/item/5', Items)
})
```

### React

```js
import { createContainer, withClient } from 'mes'

const MyComponent = ({ items }) => items.map((i) => <div>{i._id}</div>)

export default withClient(createContainer({
  // Subscribe - will be auto unsubscribed on componentWillUnmount
  subscribe (props) {
    return [ props.client.subscribe(/* ... */) ]
  },
  // Fetch any data from the minimongo store
  getData (props) {
    return { items: Items.find() }
  }
}, MyComponent)))
```
