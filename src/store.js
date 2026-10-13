// Jediné miesto, kde žijú dáta aplikácie.
// Zatiaľ je všetko statické (v pamäti) – po refreshi stránky sa dáta vrátia do pôvodného stavu.
// Neskôr sa tieto polia budú plniť z backendu (API), zvyšok aplikácie sa meniť nemusí.

import { reactive } from 'vue'

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE
const now = Date.now()

// ---------------------------------------------------------------------------
// Statické (mock) dáta
// ---------------------------------------------------------------------------

const users = [
  { id: 1, firstName: 'Jozef', lastName: 'Mrkvička', nick: 'jozko', email: 'jozko@stuba.sk', password: 'heslo123', status: 'online' },
  { id: 2, firstName: 'Eduard', lastName: 'Kováč', nick: 'ed', email: 'ed@stuba.sk', password: 'heslo123', status: 'online' },
  { id: 3, firstName: 'Lucia', lastName: 'Horváthová', nick: 'lucia', email: 'lucia@stuba.sk', password: 'heslo123', status: 'dnd' },
  { id: 4, firstName: 'Marek', lastName: 'Baláž', nick: 'marek', email: 'marek@stuba.sk', password: 'heslo123', status: 'online' },
  { id: 5, firstName: 'Peter', lastName: 'Šimko', nick: 'peto', email: 'peto@stuba.sk', password: 'heslo123', status: 'offline' },
  { id: 6, firstName: 'Tomáš', lastName: 'Rypal', nick: 'trollko', email: 'trollko@stuba.sk', password: 'heslo123', status: 'online' }
]

// type: 'public' | 'private', admin: id používateľa, ktorý kanál vytvoril
const channels = [
  { id: 1, name: 'vseobecne', type: 'public', admin: 4, lastMessage: now },
  { id: 2, name: 'vpwa-tim', type: 'private', admin: 1, lastMessage: now },
  { id: 3, name: 'hry', type: 'private', admin: 3, lastMessage: now - 1 * DAY },
  { id: 4, name: 'linux', type: 'public', admin: 4, lastMessage: now - 2 * DAY },
  { id: 5, name: 'tajny', type: 'private', admin: 2, lastMessage: now - 1 * DAY },
  { id: 6, name: 'stary-kanal', type: 'public', admin: 1, lastMessage: now - 40 * DAY } // po 30 dňoch zanikne
]

// Členstvo používateľa v kanáli. state: 'joined' | 'invited' | 'banned'
const members = [
  { channel: 1, user: 1, state: 'joined' },
  { channel: 1, user: 2, state: 'joined' },
  { channel: 1, user: 3, state: 'joined' },
  { channel: 1, user: 4, state: 'joined' },
  { channel: 1, user: 5, state: 'joined' },
  { channel: 1, user: 6, state: 'joined' },
  { channel: 2, user: 1, state: 'joined' },
  { channel: 2, user: 2, state: 'joined' },
  { channel: 2, user: 3, state: 'joined' },
  { channel: 3, user: 3, state: 'joined' },
  { channel: 3, user: 1, state: 'invited' },
  { channel: 4, user: 4, state: 'joined' },
  { channel: 4, user: 5, state: 'banned' },
  { channel: 5, user: 2, state: 'joined' },
  { channel: 6, user: 1, state: 'joined' }
]

const messages = [
  { id: 81, channel: 2, user: 2, time: now - 80 * MINUTE, text: 'urobil som UML' },
  { id: 82, channel: 2, user: 3, time: now - 60 * MINUTE, text: 'layout je hotový' },
  { id: 83, channel: 2, user: 2, time: now - 40 * MINUTE, text: '@jozko spravíš príkazový riadok?' },
  { id: 84, channel: 2, user: 1, time: now - 20 * MINUTE, text: 'jasné' },
  { id: 85, channel: 4, user: 4, time: now - 3000 * MINUTE, text: 'arch btw' },
  { id: 86, channel: 6, user: 1, time: now - 40 * DAY, text: 'tu už nikto nepíše' }
]

// Kanál #vseobecne dostane 80 starších správ, aby bolo čo načítavať cez infinite scroll.
const smallTalk = [
  'kto ide zajtra na prednášku?', 'zajtra je zrušené cvičenie', 'idem na kávu', 'dobré ráno',
  'ten lab bol brutal', 'deadline je v nedeľu', '@marek kedy je zápočet?', 'má niekto poznámky?',
  '@jozko už si to odovzdal?', 'wifi zase padá'
]
for (let i = 0; i < 80; i++) {
  messages.push({
    id: i + 1,
    channel: 1,
    user: (i % 6) + 1,
    time: now - (2400 - i * 30) * MINUTE,
    text: smallTalk[i % smallTalk.length]
  })
}

// ---------------------------------------------------------------------------
// Reaktívny stav – keď sa tu niečo zmení, Vue automaticky prekreslí UI
// ---------------------------------------------------------------------------

export const store = reactive({
  users,
  channels,
  members,
  messages,
  me: null, // prihlásený používateľ
  currentChannel: null // id kanála, ktorý je otvorený
})

let lastId = 1000
function newId () {
  lastId++
  return lastId
}

// ---------------------------------------------------------------------------
// Pomocné funkcie (čítanie)
// ---------------------------------------------------------------------------

export function getUser (id) {
  return store.users.find(user => user.id === id)
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

// Kanály, v ktorých som členom alebo kam som pozvaný. Pozvánky sú vždy hore.
export function myChannels () {
  const result = store.channels.filter(channel => {
    const member = getMember(channel.id, store.me.id)
    return member !== undefined && member.state !== 'banned'
  })
  return result.sort((a, b) => isInvited(b.id) - isInvited(a.id))
}

export function channelMessages (channelId) {
  return store.messages.filter(message => message.channel === channelId)
}

export function isMentioned (message) {
  return message.text.includes('@' + store.me.nick)
}

// ---------------------------------------------------------------------------
// Akcie (zápis)
// ---------------------------------------------------------------------------

// Vráti text chyby, alebo null ak je všetko OK.
export function login (emailOrNick, password) {
  const user = store.users.find(user =>
    (user.email === emailOrNick || user.nick === emailOrNick) && user.password === password
  )
  if (!user) return 'Zlý email alebo heslo'

  store.me = user
  store.currentChannel = null
  removeExpiredChannels()
  return null
}

export function register (firstName, lastName, nick, email, password) {
  if (!firstName || !lastName || !nick || !email || !password) return 'Vyplňte všetky polia'
  if (store.users.some(user => user.nick === nick)) return 'Tento nick už existuje'
  if (store.users.some(user => user.email === email)) return 'Tento email už existuje'

  const user = { id: newId(), firstName, lastName, nick, email, password, status: 'online' }
  store.users.push(user)
  store.me = user
  store.currentChannel = null
  return null
}

export function logout () {
  store.me = null
  store.currentChannel = null
}

export function sendMessage (text) {
  const channel = getChannel(store.currentChannel)
  if (!channel || isInvited(channel.id)) return 'Nie ste členom tohto kanála'

  store.messages.push({ id: newId(), channel: channel.id, user: store.me.id, time: Date.now(), text })
  channel.lastMessage = Date.now()
  return null
}

export function acceptInvite (channelId) {
  getMember(channelId, store.me.id).state = 'joined'
}

export function declineInvite (channelId) {
  store.members = store.members.filter(member => !(member.channel === channelId && member.user === store.me.id))
  if (store.currentChannel === channelId) store.currentChannel = null
}

export function deleteChannel (channelId) {
  store.channels = store.channels.filter(channel => channel.id !== channelId)
  store.members = store.members.filter(member => member.channel !== channelId)
  store.messages = store.messages.filter(message => message.channel !== channelId)
  if (store.currentChannel === channelId) store.currentChannel = null
}

// Kanál bez novej správy viac ako 30 dní prestáva existovať (jeho názov sa uvoľní).
export function removeExpiredChannels () {
  const expired = store.channels.filter(channel => Date.now() - channel.lastMessage > 30 * DAY)
  expired.forEach(channel => deleteChannel(channel.id))
}
