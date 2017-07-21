import Nes from 'nes'
import pkg from '../../package.json'
import { Server } from './Server'

export function register (server, options, next) {
  server.register(Nes, (err) => {
    server.decorate('server', pkg.name, new Server(server))
    next(err)
  })
}

register.attributes = { pkg }
