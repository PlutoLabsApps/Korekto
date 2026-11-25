import { defineNitroPlugin } from '#imports'
import { refreshSessionUser } from '../utils/auth'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', refreshSessionUser)
})
