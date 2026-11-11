import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Message from '#models/message'
import KickVote from '#models/kick_vote'

//rovnake testovacie data ako v yap-client/src/store.js, heslo je vsade heslo123
export default class extends BaseSeeder {
  async run() {
    const users = await User.createMany([
      { firstName: 'Jozef', lastName: 'Mrkvička', fullName: 'Jozef Mrkvička', nick: 'jozko', email: 'jozko@stuba.sk', password: 'heslo123', status: 'online' },
      { firstName: 'Eduard', lastName: 'Kováč', fullName: 'Eduard Kováč', nick: 'peterbondra', email: 'ed@stuba.sk', password: 'heslo123', status: 'online' },
      { firstName: 'Lucia', lastName: 'Horváthová', fullName: 'Lucia Horváthová', nick: 'lucia', email: 'lucia@stuba.sk', password: 'heslo123', status: 'dnd' },
      { firstName: 'Marek', lastName: 'Baláž', fullName: 'Marek Baláž', nick: 'ludovahudbastanabalaza', email: 'marek@stuba.sk', password: 'heslo123', status: 'online' },
      { firstName: 'Peter', lastName: 'Šimko', fullName: 'Peter Šimko', nick: 'peto', email: 'peto@stuba.sk', password: 'heslo123', status: 'offline' },
      { firstName: 'Tomáš', lastName: 'Rypal', fullName: 'Tomáš Rypal', nick: 'trollko', email: 'trollko@stuba.sk', password: 'heslo123', status: 'online' },
    ])
    const [jozko, ed, lucia, marek, peto, trollko] = users

    const now = DateTime.now()
    const vseobecne = await Channel.create({ name: 'vseobecne', type: 'public', adminId: marek.id, lastMessageAt: now })
    const vpwaTim = await Channel.create({ name: 'vpwa-tim', type: 'private', adminId: jozko.id, lastMessageAt: now })
    const hry = await Channel.create({ name: 'hry', type: 'private', adminId: lucia.id, lastMessageAt: now.minus({ days: 1 }) })
    const linux = await Channel.create({ name: 'linux', type: 'public', adminId: marek.id, lastMessageAt: now.minus({ days: 2 }) })
    const tajny = await Channel.create({ name: 'tajny', type: 'private', adminId: ed.id, lastMessageAt: now.minus({ days: 1 }) })
    //starsi ako 30 dni, mal by zaniknut
    const staryKanal = await Channel.create({ name: 'stary-kanal', type: 'public', adminId: jozko.id, lastMessageAt: now.minus({ days: 40 }) })

    await ChannelMember.createMany([
      ...users.map((user) => ({ channelId: vseobecne.id, userId: user.id, state: 'joined' })),
      { channelId: vpwaTim.id, userId: jozko.id, state: 'joined' },
      { channelId: vpwaTim.id, userId: ed.id, state: 'joined' },
      { channelId: vpwaTim.id, userId: lucia.id, state: 'joined' },
      { channelId: hry.id, userId: lucia.id, state: 'joined' },
      { channelId: hry.id, userId: jozko.id, state: 'invited' },
      { channelId: linux.id, userId: marek.id, state: 'joined' },
      { channelId: linux.id, userId: peto.id, state: 'banned' },
      { channelId: tajny.id, userId: ed.id, state: 'joined' },
      { channelId: staryKanal.id, userId: jozko.id, state: 'joined' },
    ])

    //trollko uz ma 2 hlasy na kick
    await KickVote.createMany([
      { channelId: vseobecne.id, userId: trollko.id, voterId: ed.id },
      { channelId: vseobecne.id, userId: trollko.id, voterId: lucia.id },
    ])

    const smallTalk = [
      'kto ide zajtra na prednášku?', 'zajtra je zrušené cvičenie', 'idem na kávu', 'dobré ráno',
      'ten lab bol brutal', 'deadline je v nedeľu', 'kedy je zápočet?', 'má niekto poznámky?',
      '@jozko už si to odovzdal?', 'wifi zase padá',
    ]
    const messages = []
    for (let i = 0; i < 80; i++) {
      messages.push({
        channelId: vseobecne.id,
        userId: users[i % users.length].id,
        text: smallTalk[i % smallTalk.length],
        createdAt: now.minus({ minutes: 2400 - i * 30 }),
      })
    }
    messages.push(
      { channelId: vpwaTim.id, userId: ed.id, text: 'urobil som UML', createdAt: now.minus({ minutes: 80 }) },
      { channelId: vpwaTim.id, userId: lucia.id, text: 'layout je hotový', createdAt: now.minus({ minutes: 60 }) },
      { channelId: vpwaTim.id, userId: ed.id, text: '@jozko spravíš príkazový riadok?', createdAt: now.minus({ minutes: 40 }) },
      { channelId: vpwaTim.id, userId: jozko.id, text: 'jasné', createdAt: now.minus({ minutes: 20 }) },
      { channelId: linux.id, userId: marek.id, text: 'arch btw', createdAt: now.minus({ days: 2 }) },
      { channelId: staryKanal.id, userId: jozko.id, text: 'tu už nikto nepíše', createdAt: now.minus({ days: 40 }) }
    )
    await Message.createMany(messages)
  }
}
