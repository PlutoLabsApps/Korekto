import { sql } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { useRuntimeConfig } from '#imports'
import * as schema from '../db/schema'
import { useLogger } from './logger'

export type Database = PostgresJsDatabase<typeof schema>

const MAX_CONNECTIONS = 10
const CONNECT_TIMEOUT_SECONDS = 5

let client: postgres.Sql | undefined
let database: Database | undefined

export function useDb(): Database {
  if (!database) {
    const { url } = useRuntimeConfig().database
    if (!url) {
      throw new Error('Database is not configured: set NUXT_DATABASE_URL.')
    }

    client = postgres(url, {
      max: MAX_CONNECTIONS,
      connect_timeout: CONNECT_TIMEOUT_SECONDS,
      onnotice: (notice) => useLogger('database').debug(notice.message),
    })
    database = drizzle(client, { schema, casing: 'snake_case' })
  }

  return database
}

export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await useDb().execute(sql`select 1`)
    return true
  } catch (error) {
    useLogger('database').warn('Database is unreachable:', error)
    return false
  }
}

export async function closeDb(): Promise<void> {
  const current = client
  client = undefined
  database = undefined
  await current?.end()
}
