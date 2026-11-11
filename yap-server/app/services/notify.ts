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
export async function newMessage(message: Message) {
  const members = await ChannelMember.query()
    .where('channelId', message.channelId)
    .where('state', 'joined')

  const data = {
    id: message.id,
    channelId: message.channelId,
    userId: message.userId,
    text: message.text,
    createdAt: message.createdAt ? message.createdAt.toISO() : null,
    nick: message.author ? message.author.nick : null,
  }

  for (const member of members) {
    if (member.userId !== message.userId) {
      socket.to('users/' + member.userId).emit('message:new', data)
    }
  }
}
