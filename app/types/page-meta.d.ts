import type { UserRole } from '#shared/utils/auth'

declare module '#app' {
  interface PageMeta {
    role?: UserRole
  }
}

export {}
