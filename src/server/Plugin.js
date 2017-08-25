import Nes from 'nes'
import pkg from '../../package.json'
import { Server } from './Server'

export function register (server, options, next) {
  server.register(Nes, (err) => {
    if (err) return next(err)
    server.decorate('server', 'nq', new Server(server))
    next()
  })
}

register.attributes = { pkg }
