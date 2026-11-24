import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { applyMigrations, MIGRATIONS_FOLDER, startMigrations } from '../../server/utils/migrations'

const { runtimeConfig, logger, db } = vi.hoisted(() => ({
  runtimeConfig: { database: { url: '' } },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  db: { name: 'fake-db' },
}))

mockNuxtImport('useRuntimeConfig', (original) => () => ({ ...original(), ...runtimeConfig }))

vi.mock('../../server/utils/logger', () => ({
  useLogger: () => logger,
}))

vi.mock('../../server/utils/db', () => ({
  useDb: () => db,
}))

vi.mock('drizzle-orm/postgres-js/migrator', () => ({
  migrate: vi.fn(),
}))

const DATABASE_URL = 'postgres://user:pass@localhost:5432/korekto'

describe('applyMigrations', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('applies migrations from the migrations folder', async () => {
    await applyMigrations({ databaseUrl: DATABASE_URL, dev: false })

    expect(migrate).toHaveBeenCalledWith(db, { migrationsFolder: MIGRATIONS_FOLDER })
    expect(MIGRATIONS_FOLDER).toMatch(/server[/\\]db[/\\]migrations$/)
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Migrations are up to date'))
  })

  it('skips with a warning in development when the database is not configured', async () => {
    await applyMigrations({ databaseUrl: '', dev: true })

    expect(migrate).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('NUXT_DATABASE_URL'))
  })

  it('fails in production when the database is not configured', async () => {
    await expect(applyMigrations({ databaseUrl: '', dev: false })).rejects.toThrow(
      'NUXT_DATABASE_URL',
    )
    expect(migrate).not.toHaveBeenCalled()
  })
})

describe('startMigrations', () => {
  let exit: MockInstance<typeof process.exit>

  beforeEach(() => {
    runtimeConfig.database.url = DATABASE_URL
    exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    exit.mockRestore()
    vi.clearAllMocks()
  })

  it('resolves without exiting when migrations succeed', async () => {
    await startMigrations(false)

    expect(migrate).toHaveBeenCalledTimes(1)
    expect(exit).not.toHaveBeenCalled()
  })

  it('stops the process in production when migrations fail', async () => {
    vi.mocked(migrate).mockRejectedValueOnce(new Error('syntax error'))

    await startMigrations(false)

    expect(logger.error).toHaveBeenCalledWith('Migrations failed:', expect.any(Error))
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('keeps running in development when migrations fail', async () => {
    vi.mocked(migrate).mockRejectedValueOnce(new Error('connection refused'))

    await startMigrations(true)

    expect(logger.error).toHaveBeenCalledWith('Migrations failed:', expect.any(Error))
    expect(exit).not.toHaveBeenCalled()
  })
})
