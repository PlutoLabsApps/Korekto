import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../server/api/auth/login.post'
import { callHandler, dbUser, publicUser } from './helpers'

const { db, logger } = vi.hoisted(() => ({
  db: { query: { users: { findFirst: vi.fn() } } },
  logger: { info: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../server/utils/db', () => ({ useDb: () => db }))
vi.mock('../../../server/utils/logger', () => ({ useLogger: () => logger }))

const hashPassword = vi.fn(async () => '$scrypt$dummy')
const verifyPassword = vi.fn()
const replaceUserSession = vi.fn(async () => ({}))
vi.stubGlobal('hashPassword', hashPassword)
vi.stubGlobal('verifyPassword', verifyPassword)
vi.stubGlobal('replaceUserSession', replaceUserSession)

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts a session for valid credentials', async () => {
    db.query.users.findFirst.mockResolvedValue(dbUser)
    verifyPassword.mockResolvedValue(true)

    const response = await callHandler(handler, { email: 'JAN@skola.cz', password: 'heslo1234' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(publicUser)
    expect(verifyPassword).toHaveBeenCalledWith('$scrypt$stored', 'heslo1234')
    expect(replaceUserSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ user: publicUser, secure: { sessionVersion: 1 } }),
    )
  })

  it('returns 401 for a wrong password', async () => {
    db.query.users.findFirst.mockResolvedValue(dbUser)
    verifyPassword.mockResolvedValue(false)

    const response = await callHandler(handler, { email: 'jan@skola.cz', password: 'wrong-pass' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('errors.invalidCredentials')
    expect(replaceUserSession).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('returns the same 401 for an unknown email and still verifies a password', async () => {
    db.query.users.findFirst.mockResolvedValue(undefined)
    verifyPassword.mockResolvedValue(false)

    const response = await callHandler(handler, {
      email: 'nobody@skola.cz',
      password: 'wrong-pass',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('errors.invalidCredentials')
    expect(verifyPassword).toHaveBeenCalledWith('$scrypt$dummy', 'wrong-pass')
    expect(replaceUserSession).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid input without querying the database', async () => {
    const response = await callHandler(handler, { email: 'nope', password: '' })

    expect(response.status).toBe(400)
    expect(response.body.data.fieldErrors).toEqual({
      email: ['validation.emailInvalid'],
      password: ['validation.passwordRequired'],
    })
    expect(db.query.users.findFirst).not.toHaveBeenCalled()
  })
})
