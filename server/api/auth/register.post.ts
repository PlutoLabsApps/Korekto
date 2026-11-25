import { createError, defineEventHandler, setResponseStatus } from 'h3'
import { registerSchema } from '../../../shared/utils/auth'
import { users } from '../../db/schema'
import { startUserSession, toPublicUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { useLogger } from '../../utils/logger'
import { readValidatedJson } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const input = await readValidatedJson(event, registerSchema)

  const [user] = await useDb()
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    })
    .onConflictDoNothing({ target: users.email })
    .returning()

  if (!user) {
    throw createError({ statusCode: 409, message: 'Tento e-mail je už zaregistrovaný.' })
  }

  await startUserSession(event, user)
  useLogger('auth').info('User registered', { userId: user.id, role: user.role })
  setResponseStatus(event, 201)
  return toPublicUser(user)
})
