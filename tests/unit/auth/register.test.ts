import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../server/api/auth/register.post'
import { callHandler, dbUser, publicUser } from './helpers'

const { db, logger } = vi.hoisted(() => {
  const returning = vi.fn()
  const values = vi.fn(() => ({ onConflictDoNothing: () => ({ returning }) }))
  return {
    db: { insert: vi.fn(() => ({ values })), values, returning },
    logger: { info: vi.fn(), warn: vi.fn() },
  }
})

vi.mock('../../../server/utils/db', () => ({ useDb: () => db }))
vi.mock('../../../server/utils/logger', () => ({ useLogger: () => logger }))

const hashPassword = vi.fn(async () => '$scrypt$new')
const replaceUserSession = vi.fn(async () => ({}))
vi.stubGlobal('hashPassword', hashPassword)
vi.stubGlobal('replaceUserSession', replaceUserSession)

const validBody = {
  name: ' Jan Novák ',
  email: ' Jan@Skola.CZ ',
  password: 'heslo1234',
  role: 'teacher',
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.returning.mockResolvedValue([dbUser])
  })

  it('creates the user, starts a session and returns the public user', async () => {
    const response = await callHandler(handler, validBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual(publicUser)
    expect(hashPassword).toHaveBeenCalledWith('heslo1234')
    expect(db.values).toHaveBeenCalledWith({
      name: 'Jan Novák',
      email: 'jan@skola.cz',
      role: 'teacher',
      passwordHash: '$scrypt$new',
    })
    expect(replaceUserSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ user: publicUser, secure: { sessionVersion: 1 } }),
    )
  })

  it('logs the user id but not the email or password', async () => {
    await callHandler(handler, validBody)

    const logged = JSON.stringify(logger.info.mock.calls)
    expect(logged).toContain(dbUser.id)
    expect(logged).not.toContain('jan@skola.cz')
    expect(logged).not.toContain('heslo1234')
  })

  it('returns 409 when the email is already registered', async () => {
    db.returning.mockResolvedValue([])

    const response = await callHandler(handler, validBody)

    expect(response.status).toBe(409)
    expect(response.body.message).toBe('errors.emailTaken')
    expect(replaceUserSession).not.toHaveBeenCalled()
  })

  it('returns 400 with field error keys for invalid input', async () => {
    const response = await callHandler(handler, {
      name: '',
      email: 'nope',
      password: 'short',
      role: 'admin',
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('errors.invalidInput')
    expect(response.body.data.fieldErrors).toEqual({
      name: ['validation.nameRequired'],
      email: ['validation.emailInvalid'],
      password: ['validation.passwordMin'],
      role: ['validation.roleRequired'],
    })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('returns 400 for a body that is not JSON', async () => {
    const response = await callHandler(handler, 'not json')

    expect(response.status).toBe(400)
    expect(db.insert).not.toHaveBeenCalled()
  })
})
