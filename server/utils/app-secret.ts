import { useRuntimeConfig } from '#imports'
import { useLogger } from './logger'

export const APP_SECRET_MIN_LENGTH = 32

export function isValidAppSecret(secret: unknown): secret is string {
  return typeof secret === 'string' && secret.length >= APP_SECRET_MIN_LENGTH
}

export function verifyAppSecret(dev: boolean): void {
  if (dev || isValidAppSecret(useRuntimeConfig().appSecret)) {
    return
  }

  useLogger('auth').error(
    `NUXT_APP_SECRET must be set to at least ${APP_SECRET_MIN_LENGTH} characters.`,
  )
  process.exit(1)
}
