<script setup lang="ts">
import { ScanLine } from '@lucide/vue'

const { t } = useI18n()
const { loggedIn, user, clear } = useUserSession()

async function logout() {
  await clear()
  await navigateTo('/')
}
</script>

<template>
  <header class="border-b border-slate-200/80 bg-white/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <NuxtLink
        :to="loggedIn ? '/dashboard' : '/'"
        class="inline-flex min-h-7 items-center gap-2.5 rounded-sm text-lg font-bold tracking-tight text-slate-950"
        :aria-label="t('header.home')"
      >
        <span class="grid size-9 place-items-center rounded-xl bg-teal-700 text-white">
          <ScanLine :size="20" :stroke-width="2" aria-hidden="true" />
        </span>
        Korekto
      </NuxtLink>

      <div class="flex items-center gap-4 text-sm">
        <template v-if="loggedIn && user">
          <span class="hidden text-slate-600 sm:inline">
            {{ user.name }} · {{ t(`roles.${user.role}`) }}
          </span>
          <button
            type="button"
            class="font-medium text-slate-700 hover:text-slate-950"
            @click="logout"
          >
            {{ t('nav.logout') }}
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="font-medium text-slate-700 hover:text-slate-950">
            {{ t('nav.login') }}
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800"
          >
            {{ t('nav.register') }}
          </NuxtLink>
        </template>
        <LanguageSwitcher />
      </div>
    </div>
  </header>
</template>
