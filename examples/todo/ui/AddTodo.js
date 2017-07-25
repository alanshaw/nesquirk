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

    const { title, description } = this.state
    if (!title && !description) return

    this.props.client.request({
      path: '/todo',
      method: 'POST',
      payload: { title, description }
    }, (err) => {
      if (err) return console.error('Failed to add todo', err)
      this.props.history.push('/')
    })
  }

  onCancelClick = () => this.props.history.push('/')

  render () {
    return (
      <form onSubmit={this.onSubmit}>
        <h1 className='my-3'>Add TODO</h1>
        <div className='form-group'>
          <label htmlFor='title'>Title</label>
          <input className='form-control' name='title' onChange={this.onChange} value={this.state.title} />
        </div>
        <div className='form-group'>
          <label htmlFor='description'>Description</label>
          <textarea className='form-control' name='description' onChange={this.onChange} value={this.state.description} />
        </div>
        <div className='form-group'>
          <button type='submit' className='btn btn-success mr-1'>Add</button>
          <button type='button' className='btn btn-link' onClick={this.onCancelClick}>Cancel</button>
        </div>
      </form>
    )
  }
}

export default withRouter(withClient(AddTodo))
