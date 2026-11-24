// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkMigrations,
  findDestructiveStatements,
  isDestructiveAllowed,
} from '../../scripts/check-migrations'

describe('findDestructiveStatements', () => {
  it.each([
    'DROP TABLE "users";',
    'ALTER TABLE "users" DROP COLUMN "name";',
    'DROP SCHEMA "legacy" CASCADE;',
    'DROP TYPE "public"."role";',
    'DROP VIEW "stats";',
    'ALTER TABLE "users" RENAME COLUMN "name" TO "full_name";',
    'ALTER TABLE "users" RENAME TO "accounts";',
    'TRUNCATE "users";',
    'DELETE FROM "users";',
    'ALTER TABLE "users" ALTER COLUMN "age" SET DATA TYPE integer;',
    'alter table users drop column name;',
  ])('flags %s', (sql) => {
    expect(findDestructiveStatements(sql)).toEqual([{ line: 1, text: sql }])
  })

  it('ignores safe statements', () => {
    const sql = [
      'CREATE TABLE "users" ("id" uuid PRIMARY KEY);',
      '--> statement-breakpoint',
      'ALTER TABLE "users" ADD COLUMN "name" text;',
      'CREATE INDEX "users_email_idx" ON "users" ("email");',
      'DROP INDEX "old_idx";',
    ].join('\n')

    expect(findDestructiveStatements(sql)).toEqual([])
  })

  it('ignores destructive words inside comments', () => {
    expect(findDestructiveStatements('-- we never DROP TABLE here\nSELECT 1;')).toEqual([])
  })

  it('reports the line number of each statement', () => {
    const sql = 'SELECT 1;\nDROP TABLE "a";\nSELECT 2;\nDROP TABLE "b";'

    expect(findDestructiveStatements(sql).map((statement) => statement.line)).toEqual([2, 4])
  })
})

describe('isDestructiveAllowed', () => {
  it('accepts the marker with a reason', () => {
    expect(isDestructiveAllowed('-- allow-destructive: replaced by full_name\nDROP TABLE x;')).toBe(
      true,
    )
  })

  it('rejects the marker without a reason', () => {
    expect(isDestructiveAllowed('-- allow-destructive:\nDROP TABLE x;')).toBe(false)
  })

  it('rejects files without the marker', () => {
    expect(isDestructiveAllowed('DROP TABLE x;')).toBe(false)
  })
})

describe('checkMigrations', () => {
  let folder: string

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'korekto-migrations-'))
  })

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true })
  })

  it('reports only unapproved destructive migrations', () => {
    writeFileSync(join(folder, '0000_init.sql'), 'SELECT 1;')
    writeFileSync(join(folder, '0001_drop.sql'), 'ALTER TABLE "users" DROP COLUMN "name";')
    writeFileSync(
      join(folder, '0002_allowed.sql'),
      '-- allow-destructive: cleanup\nDROP TABLE "old";',
    )
    writeFileSync(join(folder, 'notes.txt'), 'DROP TABLE "ignored";')

    expect(checkMigrations(folder)).toEqual([
      {
        file: join(folder, '0001_drop.sql'),
        statements: [{ line: 1, text: 'ALTER TABLE "users" DROP COLUMN "name";' }],
      },
    ])
  })

  it('passes for the project migrations', () => {
    expect(checkMigrations('server/db/migrations')).toEqual([])
  })
})
