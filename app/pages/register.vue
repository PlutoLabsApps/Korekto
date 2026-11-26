<script setup lang="ts">
import {
  AUTH_MESSAGE_PARAMS,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  registerSchema,
  USER_ROLES,
  type UserRole,
} from '#shared/utils/auth'
import type { FieldErrors } from '~/composables/useApiError'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()
const { fetch: refreshSession } = useUserSession()
const { fromZodError, fromFetchError } = useApiError()

useHead({ title: () => t('auth.register.title') })

const form = reactive<{ name: string; email: string; password: string; role?: UserRole }>({
  name: '',
  email: '',
  password: '',
})
const fieldErrors = ref<FieldErrors>({})
const formError = ref<string | null>(null)
const pending = ref(false)

async function submit() {
  formError.value = null
  const result = registerSchema.safeParse(form)
  if (!result.success) {
    fieldErrors.value = fromZodError(result.error)
    return
  }

  fieldErrors.value = {}
  pending.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: result.data })
    await refreshSession()
    await navigateTo('/dashboard')
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
    <UiCard class="w-full max-w-sm">
      <form class="space-y-5" novalidate @submit.prevent="submit">
        <h1 class="text-2xl font-bold tracking-tight text-slate-950">
          {{ t('auth.register.title') }}
        </h1>

        <p
          v-if="formError"
          role="alert"
          class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ formError }}
        </p>

        <FormField
          id="name"
          v-model="form.name"
          :label="t('fields.name')"
          :error="fieldErrors.name"
          autocomplete="name"
          :maxlength="NAME_MAX_LENGTH"
        />
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
          :hint="t('auth.register.passwordHint', AUTH_MESSAGE_PARAMS)"
          type="password"
          autocomplete="new-password"
          :maxlength="PASSWORD_MAX_LENGTH"
        />

        <fieldset :aria-describedby="fieldErrors.role ? 'role-error' : undefined">
          <legend class="text-sm font-medium text-slate-800">{{ t('fields.role') }}</legend>
          <div class="mt-1.5 grid grid-cols-2 gap-2">
            <label
              v-for="role in USER_ROLES"
              :key="role"
              class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2"
              :class="form.role === role ? 'border-primary-700 bg-primary-50' : 'border-slate-300'"
            >
              <input v-model="form.role" type="radio" name="role" :value="role" />
              {{ t(`roles.${role}`) }}
            </label>
          </div>
          <p v-if="fieldErrors.role" id="role-error" class="mt-1.5 text-sm text-red-600">
            {{ fieldErrors.role }}
          </p>
        </fieldset>

        <UiButton type="submit" block :disabled="pending">{{ t('auth.register.submit') }}</UiButton>

        <p class="text-center text-sm text-slate-600">
          {{ t('auth.register.hasAccount') }}
          <NuxtLink to="/login" class="font-medium text-primary-700 hover:underline">
            {{ t('auth.register.loginLink') }}
          </NuxtLink>
        </p>
      </form>
    </UiCard>
  </main>
</template>
