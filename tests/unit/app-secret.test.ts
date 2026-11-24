import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { isValidAppSecret, verifyAppSecret } from '../../server/utils/app-secret'

const { runtimeConfig, logger } = vi.hoisted(() => ({
  runtimeConfig: { appSecret: '' as unknown },
  logger: { error: vi.fn() },
}))

mockNuxtImport('useRuntimeConfig', (original) => () => ({ ...original(), ...runtimeConfig }))

vi.mock('../../server/utils/logger', () => ({
  useLogger: () => logger,
}))

const VALID_SECRET = 'a'.repeat(32)

describe('isValidAppSecret', () => {
  it('accepts strings of at least 32 characters', () => {
    expect(isValidAppSecret(VALID_SECRET)).toBe(true)
  })

  it.each([undefined, '', 'a'.repeat(31), 42])('rejects %j', (secret) => {
    expect(isValidAppSecret(secret)).toBe(false)
  })
})

describe('verifyAppSecret', () => {
  let exit: MockInstance<typeof process.exit>

  beforeEach(() => {
    exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    exit.mockRestore()
    vi.clearAllMocks()
  })

  it('passes in production with a valid secret', () => {
    runtimeConfig.appSecret = VALID_SECRET

    verifyAppSecret(false)

    expect(exit).not.toHaveBeenCalled()
  })

  it('stops the process in production without a valid secret', () => {
    runtimeConfig.appSecret = 'too-short'

    verifyAppSecret(false)

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('NUXT_APP_SECRET'))
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('skips the check in development', () => {
    runtimeConfig.appSecret = ''

    verifyAppSecret(true)

    expect(exit).not.toHaveBeenCalled()
  })
})
