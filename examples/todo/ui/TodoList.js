import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { createContainer } from '../../../lib/client'
import Todos from './domain/Todos'

class TodoList extends Component {
  static propTypes = {
    todos: PropTypes.array.isRequired,
    client: PropTypes.object.isRequired,
    loading: PropTypes.bool
  }

  onDoneChange = (e) => {
    this.props.client.request({
      path: `/todo/${e.currentTarget.getAttribute('data-id')}`,
      method: 'PATCH',
      payload: { done: e.currentTarget.checked }
    }, (err) => {
      if (err) return console.error('Failed to update todo', err)
    })
  }

  onRemoveClick = (e) => {
    if (!window.confirm('Are you sure?')) return

    this.props.client.request({
      path: `/todo/${e.currentTarget.getAttribute('data-id')}`,
      method: 'DELETE'
    }, (err) => {
      if (err) return console.error('Failed to remove todo', err)
    })
  }

  render () {
    const { todos, loading } = this.props
    return (
      <div>
        <div className='row mt-3 mb-2'>
          <div className='col-6'>
            <h1>TODO list</h1>
          </div>
          <div className='col-6 text-right'>
            <Link to='/add' className='btn btn-primary'>Add todo</Link>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <List todos={todos} onDoneChange={this.onDoneChange} onRemoveClick={this.onRemoveClick} />
        )}
      </div>
    )
  }
}

const List = ({ todos, onDoneChange, onRemoveClick }) => todos.length ? (
  <ol className='list-group'>
    {todos.map((todo) => (
      <li key={todo._id} className={`list-group-item justify-content-between ${todo.done ? 'list-group-item-success' : ''}`}>
        <div>
          <label className='p-1 mr-2 mb-0' title={todo.done ? 'Not done?' : 'Done?'}>
            <input type='checkbox' checked={!!todo.done} onChange={onDoneChange} data-id={todo._id} />
          </label>
          <Link to={`/view/${todo._id}`}>{todo.title || 'Untitled'}</Link>
        </div>
        <div>
          <Link to={`/edit/${todo._id}`} className='btn btn-secondary btn-sm mr-2'>Edit</Link>
          <button type='button' className='btn btn-danger btn-sm' onClick={onRemoveClick} aria-label='Remove' data-id={todo._id}>
            <span aria-hidden='true'>&times;</span>
          </button>
        </div>
      </li>
    ))}
  </ol>
) : (
  <p>No todos yet!</p>
)

export default createContainer(function (props, subs) {
  const handle = this.subscribe('/todos', Todos)
  return {
    todos: Todos.find({}).sort({ createdAt: -1 }).all(),
    loading: !handle.ready()
  }
}, TodoList)
