import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile()
} catch {
  // no .env file
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL ?? '',
  },
})
