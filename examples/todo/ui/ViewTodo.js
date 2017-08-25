import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'
import { createContainer } from '../../../lib/client'
import Todos from './domain/Todos'

class ViewTodo extends Component {
  static propTypes = {
    todo: PropTypes.object,
    history: PropTypes.object.isRequired,
    loading: PropTypes.bool
  }

  constructor (props) {
    super(props)
    this.state = props.todo || {}
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

  onBackClick = () => this.props.history.push('/')

  render () {
    const { loading } = this.props
    const { _id, title, description, done, createdAt } = this.state
    if (!_id) return null

    if (loading) {
      return (
        <div>
          <div className='my-3'>
            <h1 className='mb-0 d-inline-block'>Loading...</h1>
          </div>
          <div>
            <button type='button' className='btn btn-link' onClick={this.onBackClick}>Back</button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className='my-3'>
          <h1 className='mb-0 d-inline-block align-middle mr-2'>{title || 'Untitled'}</h1>
          {done ? <span className='badge badge-success align-middle'>Done</span> : null}
        </div>
        <p className='text-muted'>{createdAt.toString()}</p>
        {description ? <p>{description}</p> : null}
        <div>
          <Link to={`/edit/${_id}`} className='btn btn-secondary mr-2'>Edit</Link>
          <button type='button' className='btn btn-link' onClick={this.onBackClick}>Back</button>
        </div>
      </div>
    )
  }
}

export default withRouter(createContainer(function ({ match }) {
  const handle = this.subscribe(`/todo/${match.params.todoId}`, Todos)

  return {
    todo: Todos.find({ _id: match.params.todoId }).first(),
    loading: !handle.ready()
  }
}, ViewTodo))
