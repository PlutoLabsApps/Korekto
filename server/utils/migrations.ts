import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { useRuntimeConfig } from '#imports'
import { useDb } from './db'
import { useLogger } from './logger'

export const MIGRATIONS_FOLDER = resolve(process.cwd(), 'server/db/migrations')

export async function applyMigrations(options: {
  databaseUrl: string
  dev: boolean
}): Promise<void> {
  const log = useLogger('database')

  if (!options.databaseUrl) {
    if (options.dev) {
      log.warn('NUXT_DATABASE_URL is not set; skipping migrations.')
      return
    }
    throw new Error('NUXT_DATABASE_URL is not set.')
  }

  const startedAt = Date.now()
  await migrate(useDb(), { migrationsFolder: MIGRATIONS_FOLDER })
  log.info(`Migrations are up to date (${Date.now() - startedAt} ms).`)
}

export function startMigrations(dev: boolean): Promise<void> {
  return applyMigrations({ databaseUrl: useRuntimeConfig().database.url, dev }).catch(
    (error: unknown) => {
      useLogger('database').error('Migrations failed:', error)
      if (!dev) {
        process.exit(1)
      }
    },
  )
}
