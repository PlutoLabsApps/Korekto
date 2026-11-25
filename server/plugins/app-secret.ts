import { defineNitroPlugin } from '#imports'
import { verifyAppSecret } from '../utils/app-secret'

export default defineNitroPlugin(() => {
  verifyAppSecret(import.meta.dev)
})
