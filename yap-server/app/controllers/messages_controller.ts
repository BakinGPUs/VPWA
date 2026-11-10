import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Message from '#models/message'
import MessageTransformer from '#transformers/message_transformer'

export default class MessagesController {
  //spravy kanala po strankach, najnovsie su na 1. strane (kvoli infinite scrollu)
  async index({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    const member = await ChannelMember.query()
      .where('channelId', channel.id)
      .where('userId', user.id)
      .where('state', 'joined')
      .first()
    if (!member) {
      return response.forbidden({ message: 'nie si clenom kanala' })
    }

    const page = request.input('page', 1)
    const messages = await Message.query()
      .where('channelId', channel.id)
      .preload('author')
      .orderBy('id', 'desc')
      .paginate(page, 20)

    return serialize(MessageTransformer.paginate(messages.all(), messages.getMeta()))
  }
}
