import { LogLevels } from 'consola'
import { describe, expect, it } from 'vitest'
import { resolveLogLevel } from '../../server/utils/logger'

describe('resolveLogLevel', () => {
  it.each([
    ['silent', LogLevels.silent],
    ['error', LogLevels.error],
    ['warn', LogLevels.warn],
    ['info', LogLevels.info],
    ['debug', LogLevels.debug],
    ['trace', LogLevels.trace],
  ])('maps %s to its consola level', (name, expected) => {
    expect(resolveLogLevel(name)).toBe(expected)
  })

  it('ignores case and surrounding whitespace', () => {
    expect(resolveLogLevel('  DEBUG ')).toBe(LogLevels.debug)
  })

  it.each([undefined, '', 'verbose', 'nonsense'])('falls back to info for %j', (name) => {
    expect(resolveLogLevel(name)).toBe(LogLevels.info)
  })
})
