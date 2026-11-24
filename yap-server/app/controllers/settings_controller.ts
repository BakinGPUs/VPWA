import type { HttpContext } from '@adonisjs/core/http'
import { statusChanged } from '#services/notify'

export default class SettingsController {
  //zmena stavu (online / dnd / offline), ostatni to hned uvidia
  async status({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const status = request.input('status')
    if (!['online', 'dnd', 'offline'].includes(status)) {
      return response.badRequest({ message: 'Neplatný stav.' })
    }

    user.status = status
    await user.save()
    await statusChanged(user.id, status)
    return { message: 'Stav zmenený.', status: status }
  }
}
