import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import User from '#models/user'
import KickVote from '#models/kick_vote'

//najde moje clenstvo v kanali
function findMember(channelId: number, userId: number) {
  return ChannelMember.query().where('channelId', channelId).where('userId', userId).first()
}

export default class ChannelsController {
  //moje kanaly, pozvanky su hore
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await Channel.deleteExpired()

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
    const name = (request.input('name') || '').toString().trim().toLowerCase()
    const isPrivate = request.input('private') === true

    if (!/^[a-z0-9_-]{1,50}$/.test(name)) {
      return response.badRequest({ message: 'Názov kanála môže obsahovať iba písmená, čísla, - a _.' })
    }

    //stare kanaly zmazeme, aby sa dalo pouzit ich meno
    await Channel.deleteExpired()

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

  //pozvanie do kanala (/invite nick)
  //private moze iba spravca, public hocijaky clen
  async invite({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    const me = await findMember(channel.id, user.id)
    if (!me || me.state !== 'joined') {
      return response.forbidden({ message: 'Nie ste členom tohto kanála.' })
    }

    const isAdmin = channel.adminId === user.id
    if (channel.type === 'private' && !isAdmin) {
      return response.forbidden({ message: 'Do súkromného kanála môže pozývať iba správca.' })
    }

    const nick = (request.input('nick') || '').toString().trim().replace(/^@/, '')
    const target = await User.findBy('nick', nick)
    if (!target) {
      return response.badRequest({ message: `Používateľ ${nick} neexistuje.` })
    }

    const member = await findMember(channel.id, target.id)

    //spravca moze zrusit ban
    if (member && member.state === 'banned') {
      if (!isAdmin) {
        return response.forbidden({ message: 'Používateľ má ban. Prístup mu môže obnoviť iba správca.' })
      }
      member.state = 'invited'
      await member.save()
      await KickVote.query().where('channelId', channel.id).where('userId', target.id).delete()
      return { message: `Ban zrušený. Používateľ @${target.nick} dostal novú pozvánku.` }
    }
    if (member && member.state === 'joined') {
      return response.badRequest({ message: `Používateľ @${target.nick} už je členom kanála.` })
    }
    if (member && member.state === 'invited') {
      return response.badRequest({ message: `Používateľ @${target.nick} už má pozvánku.` })
    }

    await ChannelMember.create({ channelId: channel.id, userId: target.id, state: 'invited' })
    return { message: `Používateľ @${target.nick} bol pozvaný do kanála.` }
  }

  //odobratie z private kanala (/revoke nick), iba spravca
  async revoke({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    if (channel.type !== 'private' || channel.adminId !== user.id) {
      return response.forbidden({ message: 'Príkaz /revoke môže použiť iba správca v súkromnom kanáli.' })
    }

    const nick = (request.input('nick') || '').toString().trim().replace(/^@/, '')
    const target = await User.findBy('nick', nick)
    if (!target) {
      return response.badRequest({ message: `Používateľ ${nick} neexistuje.` })
    }
    if (target.id === user.id) {
      return response.badRequest({ message: 'Nemôžete odobrať samého seba.' })
    }

    const member = await findMember(channel.id, target.id)
    if (!member) {
      return response.badRequest({ message: `Používateľ @${target.nick} nie je v tomto kanáli.` })
    }

    await member.delete()
    return { message: `Používateľ @${target.nick} bol odobratý z kanála.` }
  }

  //vyhodenie z public kanala (/kick nick)
  //spravca da ban hned, inak 3 hlasy od clenov = ban
  async kick({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    if (channel.type !== 'public') {
      return response.badRequest({ message: 'Príkaz /kick je dostupný iba vo verejných kanáloch.' })
    }

    const me = await findMember(channel.id, user.id)
    if (!me || me.state !== 'joined') {
      return response.forbidden({ message: 'Nie ste členom tohto kanála.' })
    }

    const nick = (request.input('nick') || '').toString().trim().replace(/^@/, '')
    const target = await User.findBy('nick', nick)
    if (!target) {
      return response.badRequest({ message: `Používateľ ${nick} neexistuje.` })
    }
    if (target.id === user.id) {
      return response.badRequest({ message: 'Nemôžete vyhodiť samého seba.' })
    }
    if (target.id === channel.adminId) {
      return response.badRequest({ message: 'Správcu kanála nie je možné vyhodiť.' })
    }

    const member = await findMember(channel.id, target.id)
    if (!member || member.state !== 'joined') {
      return response.badRequest({ message: `Používateľ @${target.nick} nie je členom kanála.` })
    }

    //spravca da ban hned
    if (channel.adminId === user.id) {
      member.state = 'banned'
      await member.save()
      return { message: `Správca natrvalo zabanoval používateľa @${target.nick}.` }
    }

    //kazdy moze hlasovat len raz
    const myVote = await KickVote.query()
      .where('channelId', channel.id)
      .where('userId', target.id)
      .where('voterId', user.id)
      .first()
    if (myVote) {
      return response.badRequest({ message: `Za vyhodenie @${target.nick} ste už hlasovali.` })
    }

    await KickVote.create({ channelId: channel.id, userId: target.id, voterId: user.id })
    const votes = await KickVote.query().where('channelId', channel.id).where('userId', target.id)

    if (votes.length >= 3) {
      member.state = 'banned'
      await member.save()
      return { message: `Používateľ @${target.nick} dostal trvalý ban (${votes.length}/3 hlasov).` }
    }
    return { message: `Hlas za vyhodenie @${target.nick} zaznamenaný (${votes.length}/3).` }
  }
}
