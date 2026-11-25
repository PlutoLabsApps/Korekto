import { eq } from 'drizzle-orm'
import { createError, type H3Event } from 'h3'
import type { SessionEvent, User as SessionUser, UserSession } from '#auth-utils'
import { users, type User } from '../db/schema'
import { useDb } from './db'

export type AuthUser = Omit<User, 'passwordHash'>

export function toPublicUser(user: AuthUser): SessionUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function startUserSession(event: H3Event, user: AuthUser): Promise<void> {
  await replaceUserSession(event, {
    user: toPublicUser(user),
    secure: { sessionVersion: user.sessionVersion },
    loggedInAt: Date.now(),
  })
}

export async function findSessionUser(event: SessionEvent): Promise<AuthUser | null> {
  const session = await getUserSession(event)
  const sessionVersion = session.secure?.sessionVersion
  if (!session.user || sessionVersion === undefined) {
    return null
  }

  const user = await useDb().query.users.findFirst({
    columns: { passwordHash: false },
    where: eq(users.id, session.user.id),
  })
  if (!user || user.sessionVersion !== sessionVersion) {
    return null
  }
  return user
}

export async function requireUser(event: H3Event): Promise<AuthUser> {
  const user = await findSessionUser(event)
  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'errors.unauthorized' })
  }
  return user
}

export async function requireRole(event: H3Event, role: User['role']): Promise<AuthUser> {
  const user = await requireUser(event)
  if (user.role !== role) {
    throw createError({ statusCode: 403, message: 'errors.forbidden' })
  }
  return user
}

export async function refreshSessionUser(session: UserSession, event: SessionEvent): Promise<void> {
  const user = await findSessionUser(event)
  if (!user) {
    await clearUserSession(event as H3Event)
    throw createError({ statusCode: 401, message: 'errors.unauthorized' })
  }
  session.user = toPublicUser(user)
}
