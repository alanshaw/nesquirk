import React, { Component } from 'react'

const noSubscribe = () => []
const noData = () => ({})

export function createContainer ({ subscribe, getData }, Comp) {
  subscribe = subscribe || noSubscribe
  getData = getData || noData

  return class Container extends Component {
    componentWillMount () {
      this.subscribe(this.props)
    }

    componentWillReceiveProps (nextProps) {
      this.resubscribe(nextProps)
    }

    componentWillUnmount () {
      this.unsubscribe()
    }

    subscribe (props) {
      const subs = subscribe(props) || []
      this._subscriptions = Array.isArray(subs) ? subs : [subs]
    }

    resubscribe (props) {
      const prevSubs = this._subscriptions
      this.subscribe(props)
      prevSubs.forEach((s) => s.stop())
    }

    unsubscribe () {
      const subs = this._subscriptions
      this._subscriptions = []
      subs.forEach((s) => s.stop())
    }

    render () {
      const { props } = this
      return <Comp {...props} {...getData(props)} />
    }
  }
}
