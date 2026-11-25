import type { H3Event } from 'h3'
import type { UserSession } from '#auth-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  refreshSessionUser,
  requireRole,
  requireUser,
  toPublicUser,
} from '../../../server/utils/auth'
import { dbUser, publicUser } from './helpers'

const { db } = vi.hoisted(() => ({
  db: { query: { users: { findFirst: vi.fn() } } },
}))

vi.mock('../../../server/utils/db', () => ({ useDb: () => db }))

const getUserSession = vi.fn()
const clearUserSession = vi.fn(async () => true)
vi.stubGlobal('getUserSession', getUserSession)
vi.stubGlobal('clearUserSession', clearUserSession)

const event = {} as H3Event
const { passwordHash: _passwordHash, ...userWithoutHash } = dbUser

function sessionFor(sessionVersion = 1) {
  return { id: 's1', user: publicUser, secure: { sessionVersion } }
}

describe('toPublicUser', () => {
  it('keeps only id, name, email and role', () => {
    expect(toPublicUser(dbUser)).toEqual(publicUser)
  })
})

describe('requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current user from the database without the password hash', async () => {
    getUserSession.mockResolvedValue(sessionFor())
    db.query.users.findFirst.mockResolvedValue(userWithoutHash)

    await expect(requireUser(event)).resolves.toEqual(userWithoutHash)
    expect(db.query.users.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ columns: { passwordHash: false } }),
    )
  })

  it.each([
    ['there is no session', {}, userWithoutHash],
    ['the user was deleted', sessionFor(), undefined],
    ['sessionVersion changed', sessionFor(1), { ...userWithoutHash, sessionVersion: 2 }],
  ])('rejects with 401 and clears the cookie when %s', async (_case, session, user) => {
    getUserSession.mockResolvedValue({ id: 's1', ...session })
    db.query.users.findFirst.mockResolvedValue(user)

    await expect(requireUser(event)).rejects.toMatchObject({
      statusCode: 401,
      message: 'errors.unauthorized',
    })
    expect(clearUserSession).toHaveBeenCalledWith(event)
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserSession.mockResolvedValue(sessionFor())
    db.query.users.findFirst.mockResolvedValue(userWithoutHash)
  })

  it('returns the user when the role matches', async () => {
    await expect(requireRole(event, 'teacher')).resolves.toEqual(userWithoutHash)
  })

  it('rejects with 403 when the role differs', async () => {
    await expect(requireRole(event, 'student')).rejects.toMatchObject({
      statusCode: 403,
      message: 'errors.forbidden',
    })
  })
})

describe('refreshSessionUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('replaces the session user with fresh database data', async () => {
    getUserSession.mockResolvedValue(sessionFor())
    db.query.users.findFirst.mockResolvedValue({ ...userWithoutHash, name: 'Jan Nový' })
    const session: UserSession = sessionFor()

    await refreshSessionUser(session, event)

    expect(session.user).toEqual({ ...publicUser, name: 'Jan Nový' })
  })

  it('clears the cookie and rejects when the session is no longer valid', async () => {
    getUserSession.mockResolvedValue(sessionFor(1))
    db.query.users.findFirst.mockResolvedValue({ ...userWithoutHash, sessionVersion: 2 })

    await expect(refreshSessionUser(sessionFor(1), event)).rejects.toMatchObject({
      statusCode: 401,
    })
    expect(clearUserSession).toHaveBeenCalledWith(event)
  })
})
