import socket from '@rlanz/socket/services/main'
import ChannelMember from '#models/channel_member'
import type Message from '#models/message'

//realtime upozornenia cez websocket, kazdy user ma svoj kanal users/:id

//userom sa zmenil zoznam kanalov alebo clenov, klient si ich nacita znova
export function channelsChanged(userIds: number[]) {
  for (const id of userIds) {
    socket.to('users/' + id).emit('channels:changed', {})
  }
}

//id vsetkych clenov kanala (aj pozvanych)
export async function channelUserIds(channelId: number) {
  const members = await ChannelMember.query()
    .where('channelId', channelId)
    .whereIn('state', ['joined', 'invited'])
  return members.map((member) => member.userId)
}

//nova sprava pre vsetkych clenov kanala okrem autora
//offline userom sa sprava neposiela, dotiahnu si ju po prepnuti na online
export async function newMessage(message: Message) {
  const members = await ChannelMember.query()
    .where('channelId', message.channelId)
    .where('state', 'joined')
    .preload('user')

  const data = {
    id: message.id,
    channelId: message.channelId,
    userId: message.userId,
    text: message.text,
    createdAt: message.createdAt ? message.createdAt.toISO() : null,
    nick: message.author ? message.author.nick : null,
  }

  for (const member of members) {
    if (member.userId !== message.userId && member.user.status !== 'offline') {
      socket.to('users/' + member.userId).emit('message:new', data)
    }
  }
}

//rozpisana sprava, posle sa ostatnym clenom kanala co nie su offline
export async function typing(channelId: number, userId: number, nick: string | null, text: string) {
  const members = await ChannelMember.query()
    .where('channelId', channelId)
    .where('state', 'joined')
    .preload('user')

  for (const member of members) {
    if (member.userId !== userId && member.user.status !== 'offline') {
      socket.to('users/' + member.userId).emit('typing', { channelId, userId, nick, text })
    }
  }
}

//zmena stavu usera, posle sa vsetkym co su s nim v nejakom kanali
export async function statusChanged(userId: number, status: string) {
  const mine = await ChannelMember.query().where('userId', userId).where('state', 'joined')
  const channelIds = mine.map((member) => member.channelId)
  if (channelIds.length === 0) return

  const others = await ChannelMember.query().whereIn('channelId', channelIds).where('state', 'joined')
  const ids = new Set(others.map((member) => member.userId))
  for (const id of ids) {
    if (id !== userId) {
      socket.to('users/' + id).emit('status:changed', { userId: userId, status: status })
    }
  }
}
