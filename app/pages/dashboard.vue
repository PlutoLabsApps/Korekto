<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const { user } = useUserSession()

useHead({ title: () => t('dashboard.title') })
</script>

<template>
  <main id="content" class="mx-auto w-full max-w-6xl flex-1 px-5 py-16 sm:px-8">
    <h1 class="text-3xl font-bold tracking-tight text-slate-950">
      {{ t('dashboard.greeting', { name: user?.name }) }}
    </h1>
    <p v-if="user" class="mt-3 text-slate-600">
      {{ t('dashboard.role', { role: t(`roles.${user.role}`) }) }}
    </p>
  </main>
</template>
