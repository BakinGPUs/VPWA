//websocket spojenie so serverom (nove spravy a zmeny kanalov naziv)
const SOCKET_URL = 'ws://localhost:3333/socket'

var ws = null
var handlers = {}
var reconnectTimer = null
var requestId = 0

//co sa ma stat ked pride event zo servera
export function onEvent (event, handler) {
  handlers[event] = handler
}

export function connectSocket (token, userId) {
  disconnectSocket()
  var current = new WebSocket(SOCKET_URL + '?token=' + encodeURIComponent(token))
  ws = current

  current.onopen = () => {
    //prihlasime sa na svoj kanal users/:id
    requestId++
    current.send(JSON.stringify({ type: 'subscribe', channel: 'users/' + userId, id: String(requestId) }))
  }

  current.onmessage = (event) => {
    var message = JSON.parse(event.data)
    if (message.type === 'event' && handlers[message.event]) {
      handlers[message.event](message.data)
    }
  }

  current.onclose = () => {
    //ked spadne spojenie, skusime sa pripojit znova o 3s
    if (current !== ws) return
    reconnectTimer = setTimeout(() => connectSocket(token, userId), 3000)
  }
}

export function disconnectSocket () {
  clearTimeout(reconnectTimer)
  if (ws) {
    var old = ws
    ws = null
    old.close()
  }
}
