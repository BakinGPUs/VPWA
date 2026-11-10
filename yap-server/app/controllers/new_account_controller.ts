import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { firstName, lastName, nick, email, password } = await request.validateUsing(signupValidator)

    const fullName = firstName + ' ' + lastName
    const user = await User.create({ fullName, firstName, lastName, nick, email, password })
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
