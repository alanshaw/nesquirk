# Nesquirk

Ties [Nes](https://github.com/hapijs/nes) + [minimongo](https://github.com/kofrasa/mingo) together for gloryful reactive apps.

## Server

```js
const Hapi = require('hapi')
const Nesquirk = require('nesquirk')

const server = new Hapi.Server()

server.connection({ host: 'localhost', port: 3000 })

server.register(Nesquirk, () => {
  // Declare a nesquirk subscription
  // opts are Nes server.subscription options
  server.nq.subscription('/item/{_id}', opts, (params, reply) => {
    // Get your initial object, reply(obj)
  })
  // Behind the scenes, the callback is attached to opts.onSubscribe
  // We call socket.publish for sending results, and then next
})
```

### Managing the subscription

We don't keep subscription documents in memory, so you have to maintain your subscriptions, just like with `Nes`.

```js
// Single item (_id) must be in the url, or in the update obj to work
server.nq.update('/item/{_id}', { _id: '59527fc54cad8b7efd5f5835', status: 'complete' })

// Multiple items
server.nq.add('/items', { _id: '5953813562844d958c6f6815', status: 'pending' })
server.nq.add('/items', [/* ... */]) // Also pass arrays here (and update/remove)
server.nq.update('/items', { _id: '5953813562844d958c6f6815', status: 'active' }) // Note: needs _id in object(s) to merge
server.nq.remove('/items', '5953813562844d958c6f6815') // Note: only pass ID(s)
```

## Client

```js
const { Client, Collection } = require('nesquirk')
const client = new Client('ws://localhost:3000')

// A mingo backed minimongo collection
const Items = new Collection('items')

client.connect((err) => {
  // Hook the '/items' publication up to the Items collection
  const handle = client.subscribe('/items', Items, (err) => {
    console.log('Ready or error')
  })

  // Stop
  handle.stop() // or
  client.unsubscribe('/items', Items)
})
```

### React

More typically, you'll use the `nesquirk` React components to manage your subscriptions and retrieve data from minimongo collections.

**main.js**

```js
import React from 'react'
import ReactDOM from 'react-dom'
import { Client, Provider } from 'nesquirk'

import MyComponent from './MyComponent'

// Setup the client connection
const client = new Client('ws://localhost:3000')
client.connect((err) => { if (err) console.error('Failed to connect', err) })

// The Provider allows you to gain access to the client from child components
// using the `withClient` helper (see below)
ReactDOM.render(
  <Provider client={client}>
    <MyComponent />
  </Provider>,
  document.getElementById('root')
)
```

**MyComponent.js**

```js
import React from 'react'
import { createContainer, withClient } from 'nesquirk'
import Items from './Items'

const MyComponent = ({ items }) => items.map((i) => <div>{i._id}</div>)

export default withClient(createContainer({
  // Subscribe - will be auto unsubscribed on componentWillUnmount
  subscribe (props) {
    // Hook the Items collection up to the '/items' subscription
    return [ props.client.subscribe('/items', Items) ]
  },
  // Fetch any data from your collections
  getData (props) {
    return { items: Items.find().all() }
  }
}, MyComponent)))
```

**Items.js**

```js
import { Collection } from 'nesquirk'
export default new Collection('items')
```
