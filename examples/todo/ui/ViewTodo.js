import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'
import { withClient, createContainer } from '../../../lib/client'
import Todos from './domain/Todos'

class ViewTodo extends Component {
  static propTypes = {
    todo: PropTypes.object,
    history: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props)
    this.state = props.todo
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
    const { _id, title, description, done, createdAt } = this.state
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

export default withRouter(withClient(createContainer({
  subscribe ({ client, match }) {
    return [client.subscribe(`/todo/${match.params.todoId}`, Todos)]
  },
  getData ({ match }) {
    return { todo: Todos.find({ _id: match.params.todoId }).first() }
  }
}, ViewTodo)))
