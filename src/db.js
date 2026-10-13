import { reactive } from 'vue'

export var db = reactive({
  users: [],
  channels: [],
  members: [],
  messages: [],
  kicks: [],
  typing: [],
  incoming: [],
  me: null,
  currentChannel: null,
  loaded: false
})

async function getFile (fileName) {
  var response = await fetch('mock/' + fileName + '.txt')
  var text = await response.text()
  return text.split('\n').filter(line => line.trim() && line[0] != '#').map(line => line.trim().split('|'))
}

export async function loadData () {
  if (db.loaded) return
  var now = Date.now()
  var rows

  rows = await getFile('users')
  for (var row of rows) {
    db.users.push({ id: row[0] * 1, firstName: row[1], lastName: row[2], nick: row[3], email: row[4], password: row[5], status: row[6] })
}
  rows = await getFile('channels')
  for (var row of rows) {
    db.channels.push({ id: row[0] * 1, name: row[1], type: row[2], admin: row[3] * 1, lastMessage: now - row[4] * 86400000 })
  }
  rows = await getFile('members')
  for (var row of rows) {
    db.members.push({ channel: row[0] * 1, user: row[1] * 1, state: row[2] })
  }
  rows = await getFile('messages')
  for (var row of rows) {
    db.messages.push({ id: row[0] * 1, channel: row[1] * 1, user: row[2] * 1, time: now - row[3] * 60000, text: row[4] })
  }
  rows = await getFile('kicks')
  for (var row of rows) {
    db.kicks.push({ channel: row[0] * 1, user: row[1] * 1, by: row[2] * 1 })
  }
  rows = await getFile('typing')
  for (var row of rows) {
    db.typing.push({ channel: row[0] * 1, user: row[1] * 1, text: row[2] })
  }
  rows = await getFile('incoming')
  for (var row of rows) {
    db.incoming.push({ channel: row[0] * 1, user: row[1] * 1, text: row[2] })
  }

  db.channels = db.channels.filter(channel => now - channel.lastMessage < 30 * 24 * 60 * 60 * 1000)

  db.loaded = true
}
export function getUser (id) {
  return db.users.find(user => user.id == id)
}

export function getMember (channelId, userId) {
  return db.members.find(member => member.channel == channelId && member.user == userId)
}

export function myChannels () {
  var result = []
  for (var member of db.members) {
    if (member.user == db.me.id && member.state == 'invited') {
      var channel = db.channels.find(channel => channel.id == member.channel)
      if (channel) result.push({ ...channel, invited: true })
    }
  }
  for (var member of db.members) {
    if (member.user == db.me.id && member.state == 'joined') {
      var channel = db.channels.find(channel => channel.id == member.channel)
      if (channel) result.push(channel)
    }
  }
  return result
}
