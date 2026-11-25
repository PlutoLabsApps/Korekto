import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import auth from '../../../app/middleware/auth'
import guest from '../../../app/middleware/guest'
import role from '../../../app/middleware/role'

const { session, navigateToMock } = vi.hoisted(() => ({
  session: { loggedIn: { value: false }, user: { value: null as { role: string } | null } },
  navigateToMock: vi.fn((target: unknown) => target),
}))

mockNuxtImport('useUserSession', (original) => () => ({ ...original(), ...session }))
mockNuxtImport('navigateTo', () => navigateToMock)

function route(fullPath: string, meta: Record<string, unknown> = {}) {
  return { fullPath, meta } as unknown as RouteLocationNormalized
}

function logIn(userRole: string | null) {
  session.loggedIn.value = userRole !== null
  session.user.value = userRole ? { role: userRole } : null
}

describe('route middleware', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
  })

  it('auth sends logged-out users to login with a redirect back', () => {
    logIn(null)

    auth(route('/dashboard?tab=1'), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/dashboard?tab=1' },
    })
  })

  it('auth lets logged-in users through', () => {
    logIn('student')

    expect(auth(route('/dashboard'), route('/'))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('guest sends logged-in users to the dashboard', () => {
    logIn('teacher')

    guest(route('/login'), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('guest lets logged-out users through', () => {
    logIn(null)

    expect(guest(route('/login'), route('/'))).toBeUndefined()
  })

  it('role sends users with another role to the dashboard', () => {
    logIn('student')

    role(route('/classes/new', { role: 'teacher' }), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('role lets the matching role and pages without a role through', () => {
    logIn('teacher')

    expect(role(route('/classes/new', { role: 'teacher' }), route('/'))).toBeUndefined()
    expect(role(route('/dashboard'), route('/'))).toBeUndefined()
  })
})
