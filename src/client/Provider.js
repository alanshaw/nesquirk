import { Component, Children } from 'react'
import PropTypes from 'prop-types'

export function createProvider (clientKey = 'client') {
  class Provider extends Component {
    static propTypes = {
      client: PropTypes.object.isRequired,
      children: PropTypes.element.isRequired
    }

    static childContextTypes = {
      [clientKey]: PropTypes.object.isRequired
    }

    getChildContext () {
      return {
        [clientKey]: this[clientKey]
      }
    }

    constructor (props, context) {
      super(props, context)
      this[clientKey] = props.client
    }

    render () {
      return Children.only(this.props.children)
    }
  }

  return Provider
}

export default createProvider()
