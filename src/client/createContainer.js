import React, { Component } from 'react'
import PropTypes from 'prop-types'
import withClient from './withClient'

const noData = () => ({})

export default function createContainer (getData, opts, Comp) {
  if (!Comp) {
    Comp = opts
    opts = {}
  }

  opts = opts || {}
  getData = getData || noData

  class Container extends Component {
    static propTypes = {
      client: PropTypes.object.isRequired
    }

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
      const client = opts.client || this.props.client
      const subs = []

      const ctx = {
        subscribe () {
          const sub = client.subscribe.apply(client, arguments)
          subs.push(sub)
          return sub
        }
      }

      const data = getData.call(ctx, props)

      // Listen for changes for the collections that belongs to these subs
      this.getCollections(subs).forEach((c) => {
        c.on('change', this.onCollectionChange)
      })

      subs.forEach((s) => s.on('ready', this.onSubscriptionReady))

      this._subs = subs
      this.setState({ data })
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

    onSubscriptionReady = () => this.resubscribe(this.props)
    onCollectionChange = () => this.resubscribe(this.props)

    render () {
      const { props } = this
      return <Comp {...props} {...this.state.data} />
    }
  }

  return withClient(Container)
}
