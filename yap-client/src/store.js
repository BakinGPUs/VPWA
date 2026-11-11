//data appky, vacsina sa nacitava zo servera

import { reactive } from 'vue'
import { api, getToken, setToken } from 'src/api'

//mock data

//users, kanaly a clenovia sa nacitavaju zo servera
const users = []
const channels = []
const members = []

//kick hlasy - user je koho kickuju, by je kto hlasoval
const kicks = [
  { channel: 1, user: 6, by: 2 },
  { channel: 1, user: 6, by: 3 }
]

//kto prave pise
const typing = [
  { channel: 1, user: 2, text: 'ja si myslím, že ten deadline posunú, ale ešte to neoverili...' },
  { channel: 2, user: 3, text: 'hotovo, nahrala som nový commit' }
]

//spravy co pridu po kliknuti na test notifikacie
const incoming = [
  { channel: 1, user: 2, text: '@jozko máš hotový ten príkazový riadok?' },
  { channel: 2, user: 3, text: 'zajtra konzultácia o 10:00' },
  { channel: 1, user: 4, text: 'kto ide na obed?' },
  { channel: 1, user: 6, text: 'vyskúšajte notifikácie' }
]

//spravy sa nacitavaju zo servera, pozri loadMessages
const messages = []

//stav

export const store = reactive({
  users,
  channels,
  members,
  messages,
  kicks,
  typing,
  incoming,
  me: null,
  currentChannel: null,
  onlyMe: false, //notifikacie iba ked ma niekto oznaci
  offlineSince: 0 //kedy sa dal offline, 0 = nie je offline
})

let lastId = 1000
function newId () {
  lastId++
  return lastId
}

//helpery

export function getUser (id) {
  return store.users.find(user => user.id === id)
}

export function getUserByNick (nick) {
  return store.users.find(user => user.nick.toLowerCase() === nick.toLowerCase())
}

export function getChannel (id) {
  return store.channels.find(channel => channel.id === id)
}

export function getMember (channelId, userId) {
  return store.members.find(member => member.channel === channelId && member.user === userId)
}

export function isInvited (channelId) {
  const member = getMember(channelId, store.me.id)
  return member !== undefined && member.state === 'invited'
}

//kanaly kde som clen alebo pozvany, pozvanky idu hore
export function myChannels () {
  const result = store.channels.filter(channel => {
    const member = getMember(channel.id, store.me.id)
    return member !== undefined && member.state !== 'banned'
  })
  return result.sort((a, b) => isInvited(b.id) - isInvited(a.id))
}

export function channelMembers (channelId) {
  return store.members.filter(member => member.channel === channelId && member.state !== 'banned')
}

//ked som offline, nove spravy od inych neukazujem
export function channelMessages (channelId) {
  return store.messages.filter(message =>
    message.channel === channelId &&
    (!store.offlineSince || message.time < store.offlineSince || message.user === store.me.id)
  )
}

export function channelTyping (channelId) {
  return store.typing.filter(t => t.channel === channelId && t.user !== store.me?.id)
}

export function isMentioned (message) {
  return message.text.includes('@' + store.me.nick)
}

//login, register, stav, spravy

//user zo servera, ak ho mame aj v mock datach tak sa spoja
function setMe (user, token) {
  setToken(token)
  var existing = getUser(user.id)
  if (existing) {
    Object.assign(existing, user)
    store.me = existing
  } else {
    store.users.push(user)
    store.me = user
  }
  store.me.status = 'online'
  store.offlineSince = 0
  store.currentChannel = null
}

export async function login (email, password) {
  try {
    var result = await api('POST', '/auth/login', { email: email, password: password })
    setMe(result.data.user, result.data.token)
    await loadChannels()
    return null
  } catch (error) {
    return error.message
  }
}

export async function register (firstName, lastName, nick, email, password) {
  if (!firstName || !lastName || !nick || !email || !password) return 'Vyplňte všetky polia'
  try {
    var result = await api('POST', '/auth/signup', {
      fullName: firstName + ' ' + lastName,
      firstName: firstName,
      lastName: lastName,
      nick: nick,
      email: email,
      password: password,
      passwordConfirmation: password
    })
    setMe(result.data.user, result.data.token)
    await loadChannels()
    return null
  } catch (error) {
    return error.message
  }
}

//po refreshi stranky, ak mame token tak sa skusime prihlasit
export async function restoreSession () {
  var token = getToken()
  if (!token) return
  try {
    var result = await api('GET', '/account/profile')
    setMe(result.data, token)
    await loadChannels()
  } catch (error) {
    setToken(null)
  }
}

export async function logout () {
  try {
    await api('POST', '/account/logout')
  } catch (error) {
  }
  setToken(null)
  store.me = null
  store.currentChannel = null
  store.offlineSince = 0
}

export function setStatus (status) {
  if (!store.me) return
  store.me.status = status
  if (status === 'offline') {
    store.offlineSince = Date.now()
  } else {
    store.offlineSince = 0
  }
}

//nacita 1 stranu sprav kanala zo servera (20 sprav, od najnovsich)
export async function loadMessages (channelId, page) {
  var result
  try {
    result = await api('GET', '/channels/' + channelId + '/messages?page=' + page)
  } catch (error) {
    return { hasMore: false, error: error.message }
  }

  //pri 1. strane zahodime stare spravy kanala
  if (page === 1) {
    store.messages = store.messages.filter(message => message.channel !== channelId)
  }

  for (var item of result.data) {
    if (!getUser(item.userId)) {
      store.users.push({ id: item.userId, nick: item.nick, status: 'offline' })
    }
    if (store.messages.some(message => message.id === item.id)) continue
    store.messages.push({
      id: item.id,
      channel: item.channelId,
      user: item.userId,
      time: new Date(item.createdAt).getTime(),
      text: item.text
    })
  }
  store.messages.sort((a, b) => a.time - b.time)

  return { hasMore: result.metadata.currentPage < result.metadata.lastPage }
}

export function sendMessage (text) {
  if (store.me.status === 'offline') {
    return 'Ste v stave offline. Pre odosielanie správ zmeňte svoj stav na online.'
  }
  const channel = getChannel(store.currentChannel)
  if (!channel || isInvited(channel.id)) return 'Nie ste členom tohto kanála'

  store.messages.push({ id: newId(), channel: channel.id, user: store.me.id, time: Date.now(), text })
  channel.lastMessage = Date.now()
  return null
}

//moje kanaly zo servera
export async function loadChannels () {
  var result = await api('GET', '/channels')

  store.channels = result.data.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    admin: item.adminId,
    lastMessage: new Date(item.lastMessageAt).getTime()
  }))

  //moje clenstva prepiseme tymi zo servera
  store.members = store.members.filter(member => member.user !== store.me.id)
  for (var item of result.data) {
    store.members.push({ channel: item.id, user: store.me.id, state: item.state })
  }

  //ked uz nie som v otvorenom kanali
  if (store.currentChannel && !getChannel(store.currentChannel)) {
    store.currentChannel = null
  }
}

//clenovia kanala zo servera
export async function loadMembers (channelId) {
  var result
  try {
    result = await api('GET', '/channels/' + channelId + '/members')
  } catch (error) {
    return
  }

  store.members = store.members.filter(member => member.channel !== channelId || member.user === store.me.id)
  for (var item of result.data) {
    var user = getUser(item.userId)
    var data = { id: item.userId, nick: item.nick, firstName: item.firstName, lastName: item.lastName }
    if (user) Object.assign(user, data)
    else store.users.push({ ...data, status: item.status })
    if (item.userId !== store.me.id) {
      store.members.push({ channel: channelId, user: item.userId, state: item.state })
    }
  }
}

export async function acceptInvite (channelId) {
  try {
    await api('POST', '/channels/' + channelId + '/accept')
  } catch (error) {
    return error.message
  }
  await loadChannels()
  await loadMembers(channelId)
  return null
}

export async function declineInvite (channelId) {
  try {
    await api('POST', '/channels/' + channelId + '/decline')
  } catch (error) {
    return error.message
  }
  if (store.currentChannel === channelId) store.currentChannel = null
  await loadChannels()
  return null
}

//kanaly a prikazy

//novy kanal cez tlacidlo
export async function createChannel (name, isPrivate = false) {
  name = name.trim().toLowerCase()
  if (!name) return 'Zadajte názov kanála'
  try {
    var result = await api('POST', '/channels/join', { name: name, private: isPrivate, create: true })
    await loadChannels()
    store.currentChannel = result.channelId
    return null
  } catch (error) {
    return error.message
  }
}

//zrusenie kanala (iba spravca)
export async function deleteChannel (channelId) {
  var result = await api('DELETE', '/channels/' + channelId)
  if (store.currentChannel === channelId) store.currentChannel = null
  await loadChannels()
  return result.message
}

//opustenie kanala, ked som spravca tak kanal zanikne
export async function leaveChannel (channelId) {
  var result = await api('POST', '/channels/' + channelId + '/leave')
  if (store.currentChannel === channelId) store.currentChannel = null
  await loadChannels()
  return result.message
}

//fake sprava zo servera na test notifikacii
export function triggerIncomingMessage () {
  var next = store.incoming.shift()

  //ked dojdu spravy z incoming, posle sa tato
  if (!next) {
    var channelId = store.currentChannel
    if (!channelId) channelId = 1
    next = { channel: channelId, user: 2, text: '@' + store.me.nick + ' nová správa na otestovanie notifikácií!' }
  }

  var now = Date.now()
  var msg = { id: newId(), channel: next.channel, user: next.user, time: now, text: next.text }
  store.messages.push(msg)

  var channel = getChannel(next.channel)
  if (channel) channel.lastMessage = now

  return msg
}

//prikazy z prikazoveho riadku
export async function executeCommand (rawText) {
  const parts = rawText.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const arg1 = parts[1]
  const arg2 = parts[2]
  const channel = getChannel(store.currentChannel)
  const isAdmin = channel && channel.admin === store.me.id

  if (cmd === '/join') {
    if (!arg1) return { ok: false, message: 'Použitie: /join channelName [private]' }
    try {
      var result = await api('POST', '/channels/join', { name: arg1, private: arg2 === 'private' })
      await loadChannels()
      store.currentChannel = result.channelId
      return { ok: true, message: result.message }
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  if (!channel) return { ok: false, message: 'Nie ste v žiadnom kanáli.' }
  if (isInvited(channel.id)) return { ok: false, message: 'V tomto kanáli ste zatiaľ iba pozvaný. Najprv prijmite pozvánku.' }

  if (cmd === '/invite') {
    if (!arg1) return { ok: false, message: 'Použitie: /invite nickName' }
    const target = getUserByNick(arg1.replace(/^@/, ''))
    if (!target) return { ok: false, message: `Používateľ ${arg1} neexistuje.` }
    if (channel.type === 'private' && !isAdmin) {
      return { ok: false, message: 'Do súkromného kanála môže pozývať iba správca.' }
    }

    const targetMember = getMember(channel.id, target.id)
    if (targetMember && targetMember.state === 'banned') {
      if (!isAdmin) {
        return { ok: false, message: 'Používateľ má ban. Prístup mu môže obnoviť iba správca.' }
      }
      targetMember.state = 'invited'
      store.kicks = store.kicks.filter(k => !(k.channel === channel.id && k.user === target.id))
      return { ok: true, message: `Ban zrušený. Používateľovi @${target.nick} bola obnovená pozvánka.` }
    }
    if (targetMember && targetMember.state === 'joined') {
      return { ok: false, message: `Používateľ @${target.nick} už je členom kanála.` }
    }
    if (targetMember && targetMember.state === 'invited') {
      return { ok: false, message: `Používateľ @${target.nick} už má pozvánku.` }
    }

    store.members.push({ channel: channel.id, user: target.id, state: 'invited' })
    return { ok: true, message: `Používateľ @${target.nick} bol pozvaný do kanála.` }
  }

  if (cmd === '/revoke') {
    if (channel.type !== 'private' || !isAdmin) {
      return { ok: false, message: 'Príkaz /revoke môže použiť iba správca v súkromnom kanáli.' }
    }
    if (!arg1) return { ok: false, message: 'Použitie: /revoke nickName' }
    const target = getUserByNick(arg1.replace(/^@/, ''))
    if (!target) return { ok: false, message: `Používateľ ${arg1} neexistuje.` }
    if (target.id === store.me.id) return { ok: false, message: 'Nemôžete odobrať samého seba.' }

    const targetMember = getMember(channel.id, target.id)
    if (!targetMember) return { ok: false, message: `Používateľ @${target.nick} nie je v tomto kanáli.` }

    store.members = store.members.filter(m => !(m.channel === channel.id && m.user === target.id))
    return { ok: true, message: `Používateľ @${target.nick} bol odobratý zo súkromného kanála.` }
  }

  if (cmd === '/kick') {
    if (channel.type !== 'public') {
      return { ok: false, message: 'Príkaz /kick je dostupný iba vo verejných kanáloch.' }
    }
    if (!arg1) return { ok: false, message: 'Použitie: /kick nickName' }
    const target = getUserByNick(arg1.replace(/^@/, ''))
    if (!target) return { ok: false, message: `Používateľ ${arg1} neexistuje.` }
    if (target.id === store.me.id) return { ok: false, message: 'Nemôžete vyhodiť samého seba.' }
    if (target.id === channel.admin) return { ok: false, message: 'Správcu kanála nie je možné vyhodiť.' }

    const targetMember = getMember(channel.id, target.id)
    if (!targetMember || targetMember.state !== 'joined') {
      return { ok: false, message: `Používateľ @${target.nick} nie je aktívnym členom kanála.` }
    }

    if (isAdmin) {
      targetMember.state = 'banned'
      return { ok: true, message: `Správca natrvalo zabanoval používateľa @${target.nick}.` }
    }

    //kazdy moze hlasovat len raz, 3 hlasy = ban
    const votes = store.kicks.filter(kick => kick.channel === channel.id && kick.user === target.id)
    if (votes.some(kick => kick.by === store.me.id)) {
      return { ok: false, message: `Za vyhodenie @${target.nick} ste už hlasovali (${votes.length}/3).` }
    }

    store.kicks.push({ channel: channel.id, user: target.id, by: store.me.id })
    const count = votes.length + 1

    if (count >= 3) {
      targetMember.state = 'banned'
      return { ok: true, message: `Používateľ @${target.nick} dostal trvalý ban (${count}/3 hlasov).` }
    }
    return { ok: true, message: `Hlas za vyhodenie @${target.nick} zaznamenaný (${count}/3).` }
  }

  if (cmd === '/list') {
    const list = channelMembers(channel.id)
    const formatted = list.map(m => {
      const u = getUser(m.user)
      const role = m.user === channel.admin ? ' [správca]' : (m.state === 'invited' ? ' [pozvaný]' : '')
      return `@${u.nick}${role}`
    }).join(', ')
    return { ok: true, message: `Členovia (#${channel.name}): ${formatted}` }
  }

  if (cmd === '/cancel') {
    try {
      return { ok: true, message: await leaveChannel(channel.id) }
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  if (cmd === '/quit') {
    if (!isAdmin) return { ok: false, message: 'Iba správca môže zrušiť kanál príkazom /quit.' }
    try {
      return { ok: true, message: await deleteChannel(channel.id) }
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  return { ok: false, message: `Neznámy príkaz: ${cmd}` }
}
