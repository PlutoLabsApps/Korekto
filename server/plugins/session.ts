import { createError } from 'h3'
import { defineNitroPlugin } from '#imports'
import { findSessionUser, toPublicUser } from '../utils/auth'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const user = await findSessionUser(event)
    if (!user) {
      await clearUserSession(event)
      throw createError({ statusCode: 401, message: 'Přihlaste se.' })
    }
    session.user = toPublicUser(user)
  })
})
