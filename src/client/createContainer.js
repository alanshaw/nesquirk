import React, { Component } from 'react'
import PropTypes from 'prop-types'

const noData = () => ({})

export default function createContainer (getData, opts, Comp) {
  if (!Comp) {
    Comp = opts
    opts = {}
  }

  opts = opts || {}
  getData = getData || noData
  const clientKey = opts.clientKey || 'client'

  class Container extends Component {
    static contextTypes = {
      [clientKey]: PropTypes.object.isRequired
    }

    state = { data: {} }

    componentWillMount () {
      this.subscribe(this.props, this.context)
    }

    componentWillReceiveProps (nextProps, nextContext) {
      this.resubscribe(nextProps, nextContext)
    }

    componentWillUnmount () {
      this.unsubscribe()
    }

    subscribe (props, context) {
      const client = opts.client || context[clientKey]
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

    resubscribe (props, context) {
      const prevSubs = this._subs

      this.getCollections(prevSubs).forEach((c) => {
        c.removeListener('change', this.onCollectionChange)
      })

      this.subscribe(props, context)

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

    onSubscriptionReady = () => this.resubscribe(this.props, this.context)
    onCollectionChange = () => this.resubscribe(this.props, this.context)

    render () {
      const { props } = this
      return <Comp {...props} {...this.state.data} />
    }
  }

  return Container
}
