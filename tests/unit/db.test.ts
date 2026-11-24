import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeDb, isDatabaseReachable, useDb } from '../../server/utils/db'

const { runtimeConfig, logger, execute, end } = vi.hoisted(() => ({
  runtimeConfig: { database: { url: '' } },
  logger: { warn: vi.fn(), debug: vi.fn() },
  execute: vi.fn(),
  end: vi.fn(),
}))

mockNuxtImport('useRuntimeConfig', (original) => () => ({ ...original(), ...runtimeConfig }))

vi.mock('../../server/utils/logger', () => ({
  useLogger: () => logger,
}))

vi.mock('postgres', () => ({
  default: vi.fn(() => ({ end })),
}))

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({ execute })),
}))

describe('database utils', () => {
  beforeEach(() => {
    runtimeConfig.database.url = 'postgres://user:pass@localhost:5432/korekto'
  })

  afterEach(async () => {
    await closeDb()
    vi.clearAllMocks()
  })

  describe('useDb', () => {
    it('throws when NUXT_DATABASE_URL is not set', () => {
      runtimeConfig.database.url = ''

      expect(() => useDb()).toThrow('NUXT_DATABASE_URL')
      expect(postgres).not.toHaveBeenCalled()
    })

    it('creates the connection pool once and reuses it', () => {
      const first = useDb()
      const second = useDb()

      expect(first).toBe(second)
      expect(postgres).toHaveBeenCalledTimes(1)
      expect(postgres).toHaveBeenCalledWith(
        'postgres://user:pass@localhost:5432/korekto',
        expect.objectContaining({ max: 10, connect_timeout: 5 }),
      )
      expect(drizzle).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ casing: 'snake_case' }),
      )
    })
  })

  describe('isDatabaseReachable', () => {
    it('returns true when the database answers', async () => {
      execute.mockResolvedValue([{ '?column?': 1 }])

      await expect(isDatabaseReachable()).resolves.toBe(true)
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('returns false and logs a warning when the query fails', async () => {
      execute.mockRejectedValue(new Error('connection refused'))

      await expect(isDatabaseReachable()).resolves.toBe(false)
      expect(logger.warn).toHaveBeenCalledWith('Database is unreachable:', expect.any(Error))
    })

    it('returns false when the database is not configured', async () => {
      runtimeConfig.database.url = ''

      await expect(isDatabaseReachable()).resolves.toBe(false)
    })
  })

  describe('closeDb', () => {
    it('closes the pool so the next useDb creates a new one', async () => {
      const first = useDb()
      await closeDb()
      const second = useDb()

      expect(end).toHaveBeenCalledTimes(1)
      expect(postgres).toHaveBeenCalledTimes(2)
      expect(second).not.toBe(first)
    })

    it('does nothing when no pool was created', async () => {
      await closeDb()

      expect(end).not.toHaveBeenCalled()
    })
  })
})
