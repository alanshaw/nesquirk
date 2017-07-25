import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { withClient } from '../../../lib/client'

class AddTodo extends Component {
  static propTypes = {
    client: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  state = { title: '', description: '' }

  onChange = (e) => {
    const name = e.target.getAttribute('name')
    this.setState({ [name]: e.target.value })
  }

  onSubmit = (e) => {
    e.preventDefault()

    this.props.client.request({
      path: '/todo',
      method: 'POST',
      payload: this.state
    }, (err) => {
      if (err) return console.error('Failed to add todo', err)
      this.props.history.push('/')
    })
  }

  render () {
    return (
      <form onSubmit={this.onSubmit}>
        <h1>Add TODO</h1>
        <div>
          <label htmlFor='title'>Title</label>
          <input name='title' onChange={this.onChange} value={this.state.title} />
        </div>
        <div>
          <label htmlFor='description'>Description</label>
          <textarea name='description' onChange={this.onChange} value={this.state.description} />
        </div>
        <div>
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }
}

export default withRouter(withClient(AddTodo))
