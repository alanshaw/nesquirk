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
      this.setState({ data: getData(props) })

      let subs = subscribe(props) || []
      subs = Array.isArray(subs) ? subs : [subs]

      // Listen for changes for the collections that belongs to these subs
      this.getCollections(subs).forEach((c) => c.on('change', this.onChange))

      this._subs = subs
    }

    resubscribe (props) {
      const prevSubs = this._subs
      this.getCollections(prevSubs).forEach((c) => c.removeListener('change', this.onChange))
      this.subscribe(props)
      prevSubs.forEach((s) => s.stop())
    }

    unsubscribe () {
      const subs = this._subs
      this.getCollections(subs).forEach((c) => c.removeListener('change', this.onChange))
      this._subs = []
      subs.forEach((s) => s.stop())
    }

    getCollections (subs) {
      return subs.reduce((collections, s) => {
        if (collections.includes(s.Collection)) return collections
        return collections.concat(s.Collection)
      }, [])
    }

    onChange = () => this.setState({ data: getData(this.props) })

    render () {
      const { props } = this
      return <Comp {...props} {...this.state.data} />
    }
  }

  return Container
}
