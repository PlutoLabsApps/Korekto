import { z } from 'zod'
import { AUTH_MESSAGE_PARAMS } from '#shared/utils/auth'

export type FieldErrors = Partial<Record<string, string>>

interface ApiErrorBody {
  message?: string
  data?: { fieldErrors?: Record<string, string[] | undefined> }
}

export function useApiError() {
  const { t, te } = useI18n()

  function translate(key: string | undefined): string {
    return key && te(key) ? t(key, AUTH_MESSAGE_PARAMS) : t('errors.unexpected')
  }

  function translateFieldErrors(fieldErrors: Record<string, string[] | undefined>): FieldErrors {
    return Object.fromEntries(
      Object.entries(fieldErrors).flatMap(([field, keys]) =>
        keys?.[0] ? [[field, translate(keys[0])]] : [],
      ),
    )
  }

  function fromZodError(error: z.ZodError): FieldErrors {
    return translateFieldErrors(z.flattenError(error).fieldErrors)
  }

  function fromFetchError(error: unknown): { formError: string | null; fieldErrors: FieldErrors } {
    const body =
      typeof error === 'object' && error !== null && 'data' in error
        ? (error.data as ApiErrorBody | undefined)
        : undefined
    const fieldErrors = translateFieldErrors(body?.data?.fieldErrors ?? {})
    const hasFieldErrors = Object.keys(fieldErrors).length > 0
    return { formError: hasFieldErrors ? null : translate(body?.message), fieldErrors }
  }

  return { translate, fromZodError, fromFetchError }
}
