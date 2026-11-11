import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import type { MiddlewareContext } from '@rlanz/socket/types'

type SocketUser = { id: number; nick: string | null }

//kazdy user pocuva iba svoj kanal users/:id
async function onlyMe(ctx: MiddlewareContext<SocketUser>, next: () => Promise<void>) {
  const user = ctx.socket.getUserOrFail()
  if (String(user.id) !== ctx.params.id) {
    throw new SocketResponseError('Nemáte prístup.')
  }
  await next()
}

export default class UserChannel extends BaseChannel<SocketUser> {
  static pattern = 'users/:id'
  static middlewares = [onlyMe]
}
