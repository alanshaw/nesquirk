import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { createContainer } from '../../../lib/client'
import Todos from './domain/Todos'

class EditTodo extends Component {
  static propTypes = {
    todo: PropTypes.object,
    client: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    loading: PropTypes.bool
  }

  constructor (props) {
    super(props)
    this.state = props.todo ? { ...props.todo } : {}
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.todo) {
      this.setState({ ...nextProps.todo })
    }
  }

  onChange = (e) => {
    const name = e.target.getAttribute('name')
    this.setState({ [name]: e.target.value })
  }

  onSubmit = (e) => {
    e.preventDefault()

    const { title, description } = this.state
    if (!title && !description) return

    this.props.client.request({
      path: `/todo/${this.state._id}`,
      method: 'PATCH',
      payload: { title, description }
    }, (err) => {
      if (err) return console.error('Failed to edit todo', err)
      this.props.history.push('/')
    })
  }

  onCancelClick = () => this.props.history.push('/')

  render () {
    const { loading } = this.props
    return (
      <form onSubmit={this.onSubmit}>
        <h1 className='my-3'>Edit TODO</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <div className='form-group'>
              <label htmlFor='title'>Title</label>
              <input className='form-control' name='title' onChange={this.onChange} value={this.state.title} />
            </div>
            <div className='form-group'>
              <label htmlFor='description'>Description</label>
              <textarea className='form-control' name='description' onChange={this.onChange} value={this.state.description} />
            </div>
            <div className='form-group'>
              <button type='submit' className='btn btn-success mr-1'>Edit</button>
              <button type='button' className='btn btn-link' onClick={this.onCancelClick}>Cancel</button>
            </div>
          </div>
        )}
      </form>
    )
  }
}

export default withRouter(createContainer(function ({ match }) {
  const handle = this.subscribe(`/todo/${match.params.todoId}`, Todos)

  return {
    todo: Todos.find({ _id: match.params.todoId }).first(),
    loading: !handle.ready()
  }
}, EditTodo))
