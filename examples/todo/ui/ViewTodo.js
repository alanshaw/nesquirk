import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { createContainer } from 'nesquirk'
import Todos from './domain/Todos'

class ViewTodo extends Component {
  static propTypes = {
    todo: PropTypes.object,
    onEdit: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
    loading: PropTypes.bool
  }

  onEditClick = () => this.props.onEdit(this.props.todo._id)
  onBackClick = () => this.props.onBack()

  render () {
    const { loading, todo } = this.props

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

    if (!todo) return null

    const { title, description, done, createdAt } = todo

    return (
      <div>
        <div className='my-3'>
          <h1 className='mb-0 d-inline-block align-middle mr-2'>{title || 'Untitled'}</h1>
          {done ? <span className='badge badge-success align-middle'>Done</span> : null}
        </div>
        <p className='text-muted'>{createdAt.toString()}</p>
        {description ? <p>{description}</p> : null}
        <div>
          <button type='button' className='btn btn-secondary mr-2' onClick={this.onEditClick}>Edit</button>
          <button type='button' className='btn btn-link' onClick={this.onBackClick}>Back</button>
        </div>
      </div>
    )
  }
}

class ViewTodoContainer extends Component {
  static propTypes = {
    todo: PropTypes.object,
    history: PropTypes.object.isRequired,
    loading: PropTypes.bool
  }

  onEdit = (todoId) => this.props.history.push(`/edit/${todoId}`)
  onBack = () => this.props.history.push('/')

  render () {
    const { todo, loading } = this.props
    return <ViewTodo todo={todo} onEdit={this.onEdit} onBack={this.onBack} loading={loading} />
  }
}

export default withRouter(createContainer(function ({ match }) {
  const handle = this.subscribe(`/todo/${match.params.todoId}`, Todos)

  return {
    todo: Todos.find({ _id: match.params.todoId }).first(),
    loading: !handle.ready()
  }
}, ViewTodoContainer))
