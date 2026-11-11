import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'

//najde moje clenstvo v kanali
function findMember(channelId: number, userId: number) {
  return ChannelMember.query().where('channelId', channelId).where('userId', userId).first()
}

export default class ChannelsController {
  //moje kanaly, pozvanky su hore
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const members = await ChannelMember.query()
      .where('userId', user.id)
      .whereIn('state', ['joined', 'invited'])
      .preload('channel')

    const result = members.map((member) => ({
      id: member.channel.id,
      name: member.channel.name,
      type: member.channel.type,
      adminId: member.channel.adminId,
      lastMessageAt: member.channel.lastMessageAt,
      state: member.state,
    }))

    result.sort((a, b) => {
      if (a.state !== b.state) return a.state === 'invited' ? -1 : 1
      return b.lastMessageAt.toMillis() - a.lastMessageAt.toMillis()
    })
    return { data: result }
  }

  //clenovia kanala, vidi ich iba clen
  async members({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    const me = await findMember(channel.id, user.id)
    if (!me || me.state !== 'joined') {
      return response.forbidden({ message: 'Nie ste členom tohto kanála.' })
    }

    const members = await ChannelMember.query()
      .where('channelId', channel.id)
      .whereIn('state', ['joined', 'invited'])
      .preload('user')

    return {
      data: members.map((member) => ({
        userId: member.user.id,
        nick: member.user.nick,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        status: member.user.status,
        state: member.state,
      })),
    }
  }

  //prijatie pozvanky
  async accept({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const member = await findMember(params.id, user.id)
    if (!member || member.state !== 'invited') {
      return response.badRequest({ message: 'Do tohto kanála nemáte pozvánku.' })
    }
    member.state = 'joined'
    await member.save()
    return { message: 'Pozvánka prijatá.' }
  }

  //odmietnutie pozvanky
  async decline({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const member = await findMember(params.id, user.id)
    if (!member || member.state !== 'invited') {
      return response.badRequest({ message: 'Do tohto kanála nemáte pozvánku.' })
    }
    await member.delete()
    return { message: 'Pozvánka odmietnutá.' }
  }
}
