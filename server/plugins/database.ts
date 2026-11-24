import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'
import { closeDb, useDb } from '../utils/db'
import { useLogger } from '../utils/logger'

const MIGRATIONS_FOLDER = resolve(process.cwd(), 'server/db/migrations')

export default defineNitroPlugin((nitroApp) => {
  const ready = runMigrations().catch((error: unknown) => {
    useLogger('database').error('Migrations failed:', error)
    if (!import.meta.dev) {
      process.exit(1)
    }
  })

  // Nitro doesn't await async plugins, so requests wait for migrations here.
  nitroApp.hooks.hook('request', () => ready)
  nitroApp.hooks.hook('close', () => closeDb())
})

async function runMigrations(): Promise<void> {
  if (!useRuntimeConfig().database.url) {
    if (import.meta.dev) {
      useLogger('database').warn('NUXT_DATABASE_URL is not set; skipping migrations.')
      return
    }
    throw new Error('NUXT_DATABASE_URL is not set.')
  }

  const startedAt = Date.now()
  await migrate(useDb(), { migrationsFolder: MIGRATIONS_FOLDER })
  useLogger('database').info(`Migrations are up to date (${Date.now() - startedAt} ms).`)
}
