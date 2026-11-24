import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface DestructiveStatement {
  line: number
  text: string
}

export interface MigrationViolation {
  file: string
  statements: DestructiveStatement[]
}

const DESTRUCTIVE =
  /\b(DROP\s+(TABLE|COLUMN|SCHEMA|TYPE|VIEW)|RENAME\s+(COLUMN|TO)|TRUNCATE|DELETE\s+FROM|SET\s+DATA\s+TYPE)\b/i
const ALLOW_MARKER = /^[ \t]*--[ \t]*allow-destructive:[ \t]*\S/m

export function findDestructiveStatements(sql: string): DestructiveStatement[] {
  return sql.split('\n').flatMap((line, index) => {
    const code = line.replace(/--.*$/, '')
    return DESTRUCTIVE.test(code) ? [{ line: index + 1, text: line.trim() }] : []
  })
}

export function isDestructiveAllowed(sql: string): boolean {
  return ALLOW_MARKER.test(sql)
}

export function checkMigrations(folder: string): MigrationViolation[] {
  return readdirSync(folder)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .flatMap((file) => {
      const sql = readFileSync(join(folder, file), 'utf8')
      if (isDestructiveAllowed(sql)) {
        return []
      }
      const statements = findDestructiveStatements(sql)
      return statements.length ? [{ file: join(folder, file), statements }] : []
    })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const violations = checkMigrations(process.argv[2] ?? 'server/db/migrations')

  if (violations.length) {
    for (const { file, statements } of violations) {
      console.error(`✗ ${file} contains destructive statements:`)
      for (const { line, text } of statements) {
        console.error(`    line ${line}: ${text}`)
      }
      console.error()
    }
    console.error('  Destructive migrations are not allowed by default.')
    console.error('  If this is intentional, add this line at the top of the file:')
    console.error('    -- allow-destructive: <reason>')
    process.exit(1)
  }

  console.log('✓ No unapproved destructive migrations.')
}
