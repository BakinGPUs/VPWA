import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Message from '#models/message'
import MessageTransformer from '#transformers/message_transformer'
import { newMessage } from '#services/notify'

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

  //nova sprava do kanala, moze poslat iba clen
  async store({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    const member = await ChannelMember.query()
      .where('channelId', channel.id)
      .where('userId', user.id)
      .where('state', 'joined')
      .first()
    if (!member) {
      return response.forbidden({ message: 'Nie ste členom tohto kanála.' })
    }

    const text = (request.input('text') || '').toString().trim()
    if (!text) {
      return response.badRequest({ message: 'Správa je prázdna.' })
    }
    if (text.length > 2000) {
      return response.badRequest({ message: 'Správa je príliš dlhá (max 2000 znakov).' })
    }

    const message = await Message.create({ channelId: channel.id, userId: user.id, text: text })

    //kvoli zaniku kanala po 30 dnoch
    channel.lastMessageAt = DateTime.now()
    await channel.save()

    await message.load('author')
    await newMessage(message)
    return serialize(MessageTransformer.transform(message))
  }
}
