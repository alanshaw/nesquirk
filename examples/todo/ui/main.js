import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Client, Provider } from '../../../lib/client'

import TodoList from './TodoList'
import AddTodo from './AddTodo'
import EditTodo from './EditTodo'

// Setup the client connection
const client = new Client('ws://localhost:3000')
client.connect((err) => { if (err) console.error('Failed to connect', err) })

ReactDOM.render(
  <Provider client={client}>
    <Router>
      <div>
        <Route exact path='/' component={TodoList} />
        <Route exact path='/add' component={AddTodo} />
        <Route exact path='/edit/:todoId' component={EditTodo} />
      </div>
    </Router>
  </Provider>,
  document.getElementById('root')
)
