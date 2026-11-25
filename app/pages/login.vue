<script setup lang="ts">
import { loginSchema, PASSWORD_MAX_LENGTH, EMAIL_MAX_LENGTH } from '#shared/utils/auth'
import type { FieldErrors } from '~/composables/useApiError'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const { fromZodError, fromFetchError } = useApiError()

useHead({ title: () => t('auth.login.title') })

const form = reactive({ email: '', password: '' })
const fieldErrors = ref<FieldErrors>({})
const formError = ref<string | null>(null)
const pending = ref(false)

function redirectTarget(): string {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard'
}

async function submit() {
  formError.value = null
  const result = loginSchema.safeParse(form)
  if (!result.success) {
    fieldErrors.value = fromZodError(result.error)
    return
  }

  fieldErrors.value = {}
  pending.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: result.data })
    await refreshSession()
    await navigateTo(redirectTarget())
  } catch (error) {
    const parsed = fromFetchError(error)
    formError.value = parsed.formError
    fieldErrors.value = parsed.fieldErrors
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main id="content" class="flex flex-1 items-start justify-center px-5 py-16">
    <form
      class="w-full max-w-sm space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
      novalidate
      @submit.prevent="submit"
    >
      <h1 class="text-2xl font-bold tracking-tight text-slate-950">{{ t('auth.login.title') }}</h1>

      <p v-if="formError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ formError }}
      </p>

      <FormField
        id="email"
        v-model="form.email"
        :label="t('fields.email')"
        :error="fieldErrors.email"
        type="email"
        autocomplete="email"
        :maxlength="EMAIL_MAX_LENGTH"
      />
      <FormField
        id="password"
        v-model="form.password"
        :label="t('fields.password')"
        :error="fieldErrors.password"
        type="password"
        autocomplete="current-password"
        :maxlength="PASSWORD_MAX_LENGTH"
      />

      <button
        type="submit"
        class="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        :disabled="pending"
      >
        {{ t('auth.login.submit') }}
      </button>

      <p class="text-center text-sm text-slate-600">
        {{ t('auth.login.noAccount') }}
        <NuxtLink to="/register" class="font-medium text-teal-700 hover:underline">
          {{ t('auth.login.registerLink') }}
        </NuxtLink>
      </p>
    </form>
  </main>
</template>
