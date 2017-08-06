import React, { Component } from 'react'

const noSubscribe = () => []
const noData = () => ({})

export default function createContainer ({ subscribe, getData }, Comp) {
  subscribe = subscribe || noSubscribe
  getData = getData || noData

  class Container extends Component {
    state = { data: {} }

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
      let subs = subscribe(props) || []
      subs = Array.isArray(subs) ? subs : [subs]

      // Listen for changes for the collections that belongs to these subs
      this.getCollections(subs).forEach((c) => {
        c.on('change', this.onCollectionChange)
      })

      subs.forEach((s) => s.on('ready', this.onSubscriptionReady))

      this._subs = subs
      this.setState({ data: getData(props, subs) })
    }

    resubscribe (props) {
      const prevSubs = this._subs
      this.getCollections(prevSubs).forEach((c) => {
        c.removeListener('change', this.onCollectionChange)
      })
      this.subscribe(props)
      prevSubs.forEach((s) => {
        s.removeListener('ready', this.onSubscriptionReady)
        s.stop()
      })
    }

    unsubscribe () {
      const subs = this._subs
      this.getCollections(subs).forEach((c) => {
        c.removeListener('change', this.onCollectionChange)
      })
      this._subs = []
      subs.forEach((s) => {
        s.removeListener('ready', this.onSubscriptionReady)
        s.stop()
      })
    }

    getCollections (subs) {
      return subs.reduce((collections, s) => {
        if (collections.includes(s.collection)) return collections
        return collections.concat(s.collection)
      }, [])
    }

    onSubscriptionReady = () => this.setState({ data: getData(this.props, this._subs) })
    onCollectionChange = () => this.setState({ data: getData(this.props, this._subs) })

    render () {
      const { props } = this
      return <Comp {...props} {...this.state.data} />
    }
  }

  return Container
}
