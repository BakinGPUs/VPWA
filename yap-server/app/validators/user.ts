import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  firstName: vine.string().trim().minLength(1).maxLength(50),
  lastName: vine.string().trim().minLength(1).maxLength(50),
  nick: vine.string().trim().minLength(2).maxLength(30).unique({ table: 'users', column: 'nick' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: vine.string().trim().maxLength(254),
  password: vine.string(),
})
