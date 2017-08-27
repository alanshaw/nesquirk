import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { withClient } from 'nesquirk'

export class AddTodo extends Component {
  static propTypes = {
    onAdd: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
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

    this.props.onAdd({ title, description })
  }

  onCancelClick = () => this.props.onCancel()

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

class AddTodoContainer extends Component {
  static propTypes = {
    client: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  onAdd = (data) => {
    this.props.client.request({
      path: '/todo',
      method: 'POST',
      payload: data
    }, (err) => {
      if (err) return console.error('Failed to add todo', err)
      this.props.history.push('/')
    })
  }

  onCancel = () => this.props.history.push('/')

  render () {
    return <AddTodo onAdd={this.onAdd} onCancel={this.onCancel} />
  }
}

export default withRouter(withClient(AddTodoContainer))
