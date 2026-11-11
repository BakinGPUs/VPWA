import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
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

  //pridanie do kanala alebo vytvorenie noveho (/join nazov [private])
  async join({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim().toLowerCase()
    const isPrivate = request.input('private') === true

    if (!/^[a-z0-9_-]{1,50}$/.test(name)) {
      return response.badRequest({ message: 'Názov kanála môže obsahovať iba písmená, čísla, - a _.' })
    }

    let channel = await Channel.findBy('name', name)

    //kanal neexistuje, vytvori sa a ja som spravca
    if (!channel) {
      channel = await Channel.create({
        name: name,
        type: isPrivate ? 'private' : 'public',
        adminId: user.id,
        lastMessageAt: DateTime.now(),
      })
      await ChannelMember.create({ channelId: channel.id, userId: user.id, state: 'joined' })
      return { message: `Kanál #${name} (${channel.type}) bol vytvorený.`, channelId: channel.id }
    }

    //cez tlacidlo novy kanal sa nechceme pridat do existujuceho
    if (request.input('create') === true) {
      return response.badRequest({ message: 'Kanál s týmto názvom už existuje.' })
    }

    const member = await findMember(channel.id, user.id)
    if (member && member.state === 'banned') {
      return response.forbidden({ message: `V kanáli #${name} máte trvalý ban.` })
    }
    if (member && member.state === 'joined') {
      return { message: `Prešli ste do kanála #${name}.`, channelId: channel.id }
    }
    if (member && member.state === 'invited') {
      member.state = 'joined'
      await member.save()
      return { message: `Prijali ste pozvánku do kanála #${name}.`, channelId: channel.id }
    }
    if (channel.type === 'private') {
      return response.forbidden({ message: `Kanál #${name} je súkromný. Pridať vás môže iba správca.` })
    }

    //public kanal, moze sa pridat hocikto
    await ChannelMember.create({ channelId: channel.id, userId: user.id, state: 'joined' })
    return { message: `Pripojili ste sa do kanála #${name}.`, channelId: channel.id }
  }

  //opustenie kanala (/cancel), ked odide spravca tak kanal zanika
  async leave({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    const member = await findMember(channel.id, user.id)
    if (!member || member.state !== 'joined') {
      return response.badRequest({ message: 'Nie ste členom tohto kanála.' })
    }

    if (channel.adminId === user.id) {
      await channel.delete()
      return { message: `Kanál #${channel.name} zanikol (správca ho opustil).` }
    }

    await member.delete()
    return { message: `Opustili ste kanál #${channel.name}.` }
  }

  //zrusenie kanala (/quit), iba spravca
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    if (channel.adminId !== user.id) {
      return response.forbidden({ message: 'Iba správca môže zrušiť kanál.' })
    }
    await channel.delete()
    return { message: `Kanál #${channel.name} bol zrušený.` }
  }
}
