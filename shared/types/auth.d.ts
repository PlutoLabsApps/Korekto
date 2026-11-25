import type { UserRole } from '../utils/auth'

declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    role: UserRole
  }

  interface SecureSessionData {
    sessionVersion: number
  }
}

export {}
