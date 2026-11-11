import { defineConfig } from '@rlanz/socket'
import { Secret } from '@adonisjs/core/helpers'
import User from '#models/user'

export default defineConfig({
  websocket: {
    path: '/socket',
    //klient bezi na inom porte (quasar dev server)
    origin: true,
    //token posielame v url (?token=...), lebo websocket v prehliadaci nevie poslat hlavicku
    async authenticate({ httpContext }) {
      const token = httpContext.request.qs().token
      if (!token) return false

      const accessToken = await User.accessTokens.verify(new Secret(token))
      if (!accessToken) return false

      const user = await User.find(accessToken.tokenableId)
      if (!user) return false
      return { id: user.id, nick: user.nick }
    },
  },
})
