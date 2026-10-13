// Jediné miesto, kde žijú dáta aplikácie.
// Všetko je statické (v pamäti) – po refreshi stránky sa dáta vrátia do pôvodného stavu.

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
  { id: 6, name: 'stary-kanal', type: 'public', admin: 1, lastMessage: now - 40 * DAY } // po 30 dňoch neaktivity zaniká
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

// Hlasy za vyhodenie vo verejných kanáloch: { channel, user (koho), by (kto hlasoval) }
const kicks = [
  { channel: 1, user: 6, by: 2 },
  { channel: 1, user: 6, by: 3 }
]

// Rozpísané správy v reálnom čase
const typing = [
  { channel: 1, user: 2, text: 'ja si myslím, že ten deadline posunú, ale ešte to neoverili...' },
  { channel: 2, user: 3, text: 'hotovo, nahrala som nový commit' }
]

// Simulované prichádzajúce správy (napr. na otestovanie notifikácie)
const incoming = [
  { channel: 1, user: 2, text: '@jozko máš hotový ten príkazový riadok?' },
  { channel: 2, user: 3, text: 'zajtra konzultácia o 10:00' },
  { channel: 1, user: 4, text: 'kto ide na obed?' },
  { channel: 1, user: 6, text: 'vyskúšajte notifikácie' }
]

const messages = [
  { id: 81, channel: 2, user: 2, time: now - 80 * MINUTE, text: 'urobil som UML' },
  { id: 82, channel: 2, user: 3, time: now - 60 * MINUTE, text: 'layout je hotový' },
  { id: 83, channel: 2, user: 2, time: now - 40 * MINUTE, text: '@jozko spravíš príkazový riadok?' },
  { id: 84, channel: 2, user: 1, time: now - 20 * MINUTE, text: 'jasné' },
  { id: 85, channel: 4, user: 4, time: now - 3000 * MINUTE, text: 'arch btw' },
  { id: 86, channel: 6, user: 1, time: now - 40 * DAY, text: 'tu už nikto nepíše' }
]

// Staršie správy pre #vseobecne na ukážku infinite scrollu
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
// Reaktívny stav
// ---------------------------------------------------------------------------

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
  onlyMe: false, // notifikácie iba pre správy adresované používateľovi (@nick)
  offlineSince: 0 // čas prechodu do offline; ak > 0, nové správy sa zatiaľ nezobrazujú
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

// Kanály, kde je používateľ členom alebo pozvaný. Pozvánky sú na vrchu.
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

// Správy kanála s podporou offline režimu:
// Keď je nastavený offline stav, správy prichádzajúce po prechode do offline sa nezobrazujú.
// Po prepnutí do online sa kanály automaticky aktualizujú.
export function channelMessages (channelId) {
  return store.messages.filter(message => {
    if (message.channel !== channelId) return false
    if (store.offlineSince && message.time >= store.offlineSince && message.user !== store.me?.id) {
      return false
    }
    return true
  })
}

export function channelTyping (channelId) {
  return store.typing.filter(t => t.channel === channelId && t.user !== store.me?.id)
}

export function isMentioned (message) {
  return message.text.includes('@' + store.me.nick)
}

// ---------------------------------------------------------------------------
// Akcie používateľa (auth, stav & správy)
// ---------------------------------------------------------------------------

export function login (emailOrNick, password) {
  const user = store.users.find(user =>
    (user.email === emailOrNick || user.nick === emailOrNick) && user.password === password
  )
  if (!user) return 'Zlý email alebo heslo'

  store.me = user
  store.me.status = 'online'
  store.offlineSince = 0
  store.currentChannel = null
  removeExpiredChannels()
  return null
}

export function register (firstName, lastName, nick, email, password) {
  if (!firstName || !lastName || !nick || !email || !password) return 'Vyplňte všetky polia'
  if (store.users.some(user => user.nick.toLowerCase() === nick.toLowerCase())) return 'Tento nick už existuje'
  if (store.users.some(user => user.email.toLowerCase() === email.toLowerCase())) return 'Tento email už existuje'

  const user = { id: newId(), firstName, lastName, nick, email, password, status: 'online' }
  store.users.push(user)
  store.me = user
  store.offlineSince = 0
  store.currentChannel = null
  return null
}

export function logout () {
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

export function acceptInvite (channelId) {
  const member = getMember(channelId, store.me.id)
  if (member) member.state = 'joined'
}

export function declineInvite (channelId) {
  store.members = store.members.filter(member => !(member.channel === channelId && member.user === store.me.id))
  if (store.currentChannel === channelId) store.currentChannel = null
}

// ---------------------------------------------------------------------------
// Správa kanálov & Príkazy
// ---------------------------------------------------------------------------

export function createChannel (name, isPrivate = false) {
  name = name.trim().toLowerCase()
  if (!name) return 'Zadajte názov kanála'
  if (store.channels.some(c => c.name.toLowerCase() === name)) {
    return 'Kanál s týmto názvom už existuje'
  }
  const id = newId()
  store.channels.push({
    id,
    name,
    type: isPrivate ? 'private' : 'public',
    admin: store.me.id,
    lastMessage: Date.now()
  })
  store.members.push({ channel: id, user: store.me.id, state: 'joined' })
  store.currentChannel = id
  return null
}

export function deleteChannel (channelId) {
  store.channels = store.channels.filter(channel => channel.id !== channelId)
  store.members = store.members.filter(member => member.channel !== channelId)
  store.messages = store.messages.filter(message => message.channel !== channelId)
  store.kicks = store.kicks.filter(kick => kick.channel !== channelId)
  store.typing = store.typing.filter(t => t.channel !== channelId)
  if (store.currentChannel === channelId) {
    store.currentChannel = null
  }
}

export function leaveChannel (channelId) {
  const channel = getChannel(channelId)
  if (!channel) return
  if (channel.admin === store.me.id) {
    deleteChannel(channelId)
  } else {
    store.members = store.members.filter(member => !(member.channel === channelId && member.user === store.me.id))
    if (store.currentChannel === channelId) {
      store.currentChannel = null
    }
  }
}

// Kanál bez novej správy viac ako 30 dní prestáva existovať (názov sa uvoľní)
export function removeExpiredChannels () {
  const expired = store.channels.filter(channel => Date.now() - channel.lastMessage > 30 * DAY)
  expired.forEach(channel => deleteChannel(channel.id))
}

// Vyvolanie testovacej správy (simulácia príchodu správy z iného zdroja)
export function triggerIncomingMessage () {
  const next = store.incoming.shift() || {
    channel: store.currentChannel || 1,
    user: 2,
    text: `@${store.me.nick} nová správa na otestovanie notifikácií!`
  }
  const msg = {
    id: newId(),
    channel: next.channel,
    user: next.user,
    time: Date.now(),
    text: next.text
  }
  store.messages.push(msg)
  const ch = getChannel(next.channel)
  if (ch) ch.lastMessage = Date.now()
  return msg
}

// Spracovanie príkazov z fixného príkazového riadka
export function executeCommand (rawText) {
  const parts = rawText.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const arg1 = parts[1]
  const arg2 = parts[2]
  const channel = getChannel(store.currentChannel)
  const isAdmin = channel && channel.admin === store.me.id

  if (cmd === '/join') {
    if (!arg1) return { ok: false, message: 'Použitie: /join channelName [private]' }
    const name = arg1.toLowerCase()
    const existing = store.channels.find(c => c.name.toLowerCase() === name)

    if (!existing) {
      const id = newId()
      const isPrivate = arg2 === 'private'
      store.channels.push({
        id,
        name,
        type: isPrivate ? 'private' : 'public',
        admin: store.me.id,
        lastMessage: Date.now()
      })
      store.members.push({ channel: id, user: store.me.id, state: 'joined' })
      store.currentChannel = id
      return { ok: true, message: `Kanál #${name} (${isPrivate ? 'private' : 'public'}) bol vytvorený.` }
    }

    const myMembership = getMember(existing.id, store.me.id)
    if (myMembership && myMembership.state === 'banned') {
      return { ok: false, message: `V kanáli #${existing.name} máte trvalý ban.` }
    }
    if (myMembership && myMembership.state === 'joined') {
      store.currentChannel = existing.id
      return { ok: true, message: `Prešli ste do kanála #${existing.name}.` }
    }
    if (myMembership && myMembership.state === 'invited') {
      myMembership.state = 'joined'
      store.currentChannel = existing.id
      return { ok: true, message: `Prijali ste pozvánku do kanála #${existing.name}.` }
    }
    if (existing.type === 'private') {
      return { ok: false, message: `Kanál #${existing.name} je súkromný. Pridať vás môže iba správca.` }
    }

    // Verejný kanál – ľubovoľný používateľ sa môže pridať
    store.members.push({ channel: existing.id, user: store.me.id, state: 'joined' })
    store.currentChannel = existing.id
    return { ok: true, message: `Pripojili ste sa do kanála #${existing.name}.` }
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

    // Bežný člen hlasuje: každý člen môže hlasovať iba raz, pri 3 unikátnych hlasoch trvalý ban
    const alreadyVoted = store.kicks.some(k => k.channel === channel.id && k.user === target.id && k.by === store.me.id)
    if (alreadyVoted) {
      const currentVotes = new Set(store.kicks.filter(k => k.channel === channel.id && k.user === target.id).map(k => k.by)).size
      return { ok: false, message: `Za vyhodenie @${target.nick} ste už hlasovali (${currentVotes}/3).` }
    }

    store.kicks.push({ channel: channel.id, user: target.id, by: store.me.id })
    const distinctVotes = new Set(store.kicks.filter(k => k.channel === channel.id && k.user === target.id).map(k => k.by)).size

    if (distinctVotes >= 3) {
      targetMember.state = 'banned'
      return { ok: true, message: `Používateľ @${target.nick} dostal trvalý ban (${distinctVotes}/3 hlasov).` }
    }
    return { ok: true, message: `Hlas za vyhodenie @${target.nick} zaznamenaný (${distinctVotes}/3).` }
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
    const name = channel.name
    leaveChannel(channel.id)
    return {
      ok: true,
      message: isAdmin ? `Kanál #${name} zanikol (správca zrušil svoje členstvo).` : `Opustili ste kanál #${name}.`
    }
  }

  if (cmd === '/quit') {
    if (!isAdmin) return { ok: false, message: 'Iba správca môže zrušiť kanál príkazom /quit.' }
    const name = channel.name
    deleteChannel(channel.id)
    return { ok: true, message: `Správca zrušil kanál #${name}.` }
  }

  return { ok: false, message: `Neznámy príkaz: ${cmd}` }
}
