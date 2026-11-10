//komunikacia so serverom (yap-server)
const API_URL = 'http://localhost:3333/api/v1'

export function getToken () {
  return localStorage.getItem('token')
}

export function setToken (token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export async function api (method, path, body) {
  var headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  var token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token

  var response = await fetch(API_URL + path, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined
  })
  var data = await response.json().catch(() => null)

  if (!response.ok) {
    var message = 'Chyba servera (' + response.status + ')'
    if (data && data.errors && data.errors.length) message = data.errors[0].message
    else if (data && data.message) message = data.message
    throw new Error(message)
  }
  return data
}
