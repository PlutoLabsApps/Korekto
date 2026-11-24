import { defineNitroPlugin } from '#imports'
import { closeDb } from '../utils/db'
import { startMigrations } from '../utils/migrations'

export default defineNitroPlugin((nitroApp) => {
  const ready = startMigrations(import.meta.dev)

  // Nitro doesn't await async plugins, so requests wait for migrations here.
  nitroApp.hooks.hook('request', () => ready)
  nitroApp.hooks.hook('close', () => closeDb())
})
