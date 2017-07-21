import React, { Component } from 'react'

export function createContainer ({ subscribe, getData }, Comp) {
  return class Container extends Component {
    render () {
      return <Comp {...this.props} />
    }
  }
}
