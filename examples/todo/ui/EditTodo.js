import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { withClient, createContainer } from '../../../lib/client'
import Todos from './domain/Todos'

class EditTodo extends Component {
  static propTypes = {
    client: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
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

    this.props.client.request({
      path: `/todo/${this.state._id}`,
      method: 'PATCH',
      payload: { title: this.state.title, description: this.state.description }
    }, (err) => {
      if (err) return console.error('Failed to edit todo', err)
      this.props.history.push('/')
    })
  }

  render () {
    return (
      <form onSubmit={this.onSubmit}>
        <h1>Edit TODO</h1>
        <div>
          <label htmlFor='title'>Title</label>
          <input name='title' onChange={this.onChange} value={this.state.title} />
        </div>
        <div>
          <label htmlFor='description'>Description</label>
          <textarea name='description' onChange={this.onChange} value={this.state.description} />
        </div>
        <div>
          <button type='submit'>Edit</button>
        </div>
      </form>
    )
  }
}

export default withRouter(withClient(createContainer({
  subscribe ({ client, match }) {
    return [client.subscribe(`/todo/${match.params.todoId}`, Todos)]
  },
  getData ({ match }) {
    return { todo: Todos.find({ _id: match.params.todoId }).first() }
  }
}, EditTodo)))
