// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '../../shared/utils/auth'

const readLocale = (code: string): object =>
  JSON.parse(readFileSync(`i18n/locales/${code}.json`, 'utf8'))
const cs = readLocale('cs')
const en = readLocale('en')

function keys(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

function lookup(messages: object, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages)
}

describe('locales', () => {
  it('cs and en define the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(cs).sort())
  })

  it('every schema error key exists in the locale files', () => {
    const invalid = [
      registerSchema.safeParse({}),
      registerSchema.safeParse({ name: '', email: 'x', password: 'short', role: 'admin' }),
      registerSchema.safeParse({
        name: 'a'.repeat(101),
        email: `${'a'.repeat(250)}@b.cz`,
        password: 'a'.repeat(129),
        role: 'teacher',
      }),
      loginSchema.safeParse({}),
      loginSchema.safeParse({ email: 'a@b.cz', password: '' }),
    ]
    const messageKeys = new Set(
      invalid.flatMap((result) => result.error?.issues.map((issue) => issue.message) ?? []),
    )

    expect(messageKeys.size).toBeGreaterThan(0)
    for (const key of messageKeys) {
      expect(lookup(cs, key), key).toEqual(expect.any(String))
    }
  })
})
