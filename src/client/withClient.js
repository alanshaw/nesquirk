import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'

export function createWithClient (clientKey = 'client') {
  return function withClient (WrappedComponent) {
    class WithClient extends Component {
      static contextTypes = {
        [clientKey]: PropTypes.object.isRequired
      }

      render () {
        return <WrappedComponent {...{ [clientKey]: this.context[clientKey] }} {...this.props} />
      }
    }

    return hoistStatics(WithClient, WrappedComponent)
  }
}

export default createWithClient()
