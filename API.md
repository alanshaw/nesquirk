# API Reference

* [Server](#server)
    * [`server.nq.subscription(path, [options], [onSubscribe])`](#servernqsubscriptionpath-options-onsubscribe)

## Server

### `server.nq.subscription(path, [options], [onSubscribe])`

Declares a subscription path that the client can subscribe to.

* `options`
    * `filter` - an object to filter which subscription updates should be sent
    to which client. The keys are the different update types e.g.

    ```js
    {
      added: (path, message, options, next) => next(true),
      updated: (path, message, options, next) => next(true),
      removed: (path, message, options, next) => next(true)
    }
    ```
