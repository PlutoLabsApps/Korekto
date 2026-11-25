import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { loginSchema } from '../../../shared/utils/auth'

async function setup() {
  let api!: ReturnType<typeof useApiError>
  await mountSuspended(
    defineComponent({
      setup() {
        api = useApiError()
        return () => null
      },
    }),
  )
  return api
}

describe('useApiError', () => {
  beforeEach(async () => {
    await useNuxtApp().$i18n.setLocale('cs')
  })

  it('translates Zod errors per field with limits filled in', async () => {
    const { fromZodError } = await setup()
    const result = loginSchema.safeParse({ email: 'nope', password: '' })

    expect(result.success).toBe(false)
    expect(fromZodError(result.error!)).toEqual({
      email: 'Zadejte platný e-mail.',
      password: 'Zadejte heslo.',
    })
  })

  it('returns field errors from an API validation error', async () => {
    const { fromFetchError } = await setup()

    expect(
      fromFetchError({
        data: {
          message: 'errors.invalidInput',
          data: { fieldErrors: { password: ['validation.passwordMin'] } },
        },
      }),
    ).toEqual({ formError: null, fieldErrors: { password: 'Heslo musí mít alespoň 8 znaků.' } })
  })

  it('returns a form error for other API errors', async () => {
    const { fromFetchError } = await setup()

    expect(fromFetchError({ data: { message: 'errors.invalidCredentials' } })).toEqual({
      formError: 'Nesprávný e-mail nebo heslo.',
      fieldErrors: {},
    })
  })

  it('falls back to a generic message for unknown keys and network errors', async () => {
    const { fromFetchError } = await setup()

    expect(fromFetchError({ data: { message: 'Internal Server Error' } }).formError).toBe(
      'Něco se pokazilo. Zkuste to prosím znovu.',
    )
    expect(fromFetchError(new TypeError('Failed to fetch')).formError).toBe(
      'Něco se pokazilo. Zkuste to prosím znovu.',
    )
  })
})
