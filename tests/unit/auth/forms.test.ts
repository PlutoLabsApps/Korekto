import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody, setResponseStatus } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../../../app/pages/login.vue'
import RegisterPage from '../../../app/pages/register.vue'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const { api } = vi.hoisted(() => ({
  api: { requests: [] as { path: string; body: unknown }[], error: null as string | null },
}))

for (const path of ['/api/auth/login', '/api/auth/register']) {
  registerEndpoint(path, {
    method: 'POST',
    handler: async (event) => {
      api.requests.push({ path, body: await readBody(event) })
      if (api.error) {
        setResponseStatus(event, 400)
        return { statusCode: 400, message: api.error }
      }
      return {}
    },
  })
}

describe('auth forms', () => {
  beforeEach(async () => {
    await useNuxtApp().$i18n.setLocale('cs')
  })

  afterEach(() => {
    api.requests = []
    api.error = null
    navigateToMock.mockReset()
  })

  it('shows field errors and sends nothing when the login form is invalid', async () => {
    const wrapper = await mountSuspended(LoginPage)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Zadejte platný e-mail.')
    expect(wrapper.text()).toContain('Zadejte heslo.')
    expect(api.requests).toEqual([])
  })

  it('shows the API error above the login form', async () => {
    api.error = 'errors.invalidCredentials'
    const wrapper = await mountSuspended(LoginPage)

    await wrapper.get('#email').setValue('jan@skola.cz')
    await wrapper.get('#password').setValue('wrong-pass')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))

    expect(wrapper.get('[role="alert"]').text()).toBe('Nesprávný e-mail nebo heslo.')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('logs in with the cleaned values and goes to the dashboard', async () => {
    const wrapper = await mountSuspended(LoginPage)

    await wrapper.get('#email').setValue('  JAN@skola.cz ')
    await wrapper.get('#password').setValue('heslo1234')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('/dashboard'))

    expect(api.requests).toEqual([
      { path: '/api/auth/login', body: { email: 'jan@skola.cz', password: 'heslo1234' } },
    ])
  })

  it('requires a role and shows the password hint on the register form', async () => {
    const wrapper = await mountSuspended(RegisterPage)

    expect(wrapper.text()).toContain('Alespoň 8 znaků.')
    await wrapper.get('#name').setValue('Jan Novák')
    await wrapper.get('#email').setValue('jan@skola.cz')
    await wrapper.get('#password').setValue('heslo1234')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Vyberte roli.')
    expect(api.requests).toEqual([])
  })

  it('shows the duplicate-email error from the API on the register form', async () => {
    api.error = 'errors.emailTaken'
    const wrapper = await mountSuspended(RegisterPage)

    await wrapper.get('#name').setValue('Jan Novák')
    await wrapper.get('#email').setValue('jan@skola.cz')
    await wrapper.get('#password').setValue('heslo1234')
    await wrapper.get('input[value="teacher"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))

    expect(wrapper.get('[role="alert"]').text()).toBe('Tento e-mail je už zaregistrovaný.')
    expect(api.requests[0]?.body).toMatchObject({ role: 'teacher', email: 'jan@skola.cz' })
  })
})
