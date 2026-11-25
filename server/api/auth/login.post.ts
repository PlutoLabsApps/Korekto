import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { loginSchema } from '../../../shared/utils/auth'
import { users } from '../../db/schema'
import { startUserSession, toPublicUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { useLogger } from '../../utils/logger'
import { readValidatedJson } from '../../utils/validation'

let dummyHash: Promise<string> | undefined

export default defineEventHandler(async (event) => {
  const input = await readValidatedJson(event, loginSchema)

  const user = await useDb().query.users.findFirst({ where: eq(users.email, input.email) })
  // Verify against a dummy hash for unknown emails so response time doesn't reveal which exist.
  dummyHash ??= hashPassword('dummy-password-for-timing')
  const passwordHash = user?.passwordHash ?? (await dummyHash)
  const valid = await verifyPassword(passwordHash, input.password)

  if (!user || !valid) {
    useLogger('auth').warn('Failed login attempt')
    throw createError({ statusCode: 401, message: 'errors.invalidCredentials' })
  }

  await startUserSession(event, user)
  return toPublicUser(user)
})
