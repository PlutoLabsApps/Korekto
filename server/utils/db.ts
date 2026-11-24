import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { useRuntimeConfig } from '#imports'
import * as schema from '../db/schema'

export type Database = PostgresJsDatabase<typeof schema>

const MAX_CONNECTIONS = 10

let client: postgres.Sql | undefined
let database: Database | undefined

export function useDb(): Database {
  if (!database) {
    const { url } = useRuntimeConfig().database
    if (!url) {
      throw new Error('Database is not configured: set NUXT_DATABASE_URL.')
    }

    client = postgres(url, { max: MAX_CONNECTIONS })
    database = drizzle(client, { schema, casing: 'snake_case' })
  }

  return database
}

export async function closeDb(): Promise<void> {
  const current = client
  client = undefined
  database = undefined
  await current?.end()
}
