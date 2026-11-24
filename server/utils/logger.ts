import { createConsola, LogLevels, type ConsolaInstance } from 'consola'
import { useRuntimeConfig } from '#imports'

export const LOG_LEVELS = ['silent', 'error', 'warn', 'info', 'debug', 'trace'] as const
export type LogLevelName = (typeof LOG_LEVELS)[number]

const DEFAULT_LOG_LEVEL: LogLevelName = 'info'

let logger: ConsolaInstance | undefined

export function resolveLogLevel(name: string | undefined): number {
  const normalized = name?.trim().toLowerCase()
  const level = LOG_LEVELS.find((candidate) => candidate === normalized) ?? DEFAULT_LOG_LEVEL
  return LogLevels[level]
}

export function useLogger(tag?: string): ConsolaInstance {
  logger ??= createConsola({ level: resolveLogLevel(useRuntimeConfig().logLevel) })
  return tag ? logger.withTag(tag) : logger
}
