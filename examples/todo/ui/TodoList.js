import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { createContainer, withClient } from '../../../lib/client'
import Todos from './domain/Todos'

class TodoList extends Component {
  static propTypes = {
    client: PropTypes.object.isRequired
  }

  onDoneChange = (e) => {
    this.props.client.request({
      path: `/todo/${e.target.getAttribute('data-id')}`,
      method: 'PATCH',
      payload: { done: e.target.checked }
    }, (err) => {
      if (err) return console.error('Failed to update todo', err)
    })
  }

  render () {
    const { todos } = this.props
    return (
      <div>
        <h1>TODO list</h1>
        <Link to='/add'>Add todo</Link>
        <ol>
          {todos.map((todo) => (
            <li key={todo._id}>
              <Link to={`/edit/${todo._id}`}>{todo.title || 'Untitled'}</Link>
              <input type='checkbox' checked={!!todo.done} onChange={this.onDoneChange} data-id={todo._id} />
            </li>
          ))}
        </ol>
      </div>
    )
  }
}

export default withClient(createContainer({
  subscribe ({ client }) {
    return [client.subscribe('/todos', Todos)]
  },
  getData () {
    return { todos: Todos.find({}).sort({ createdAt: -1 }).all() }
  }
}, TodoList))
