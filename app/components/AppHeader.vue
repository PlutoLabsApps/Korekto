<script setup lang="ts">
import { ScanLine } from '@lucide/vue'
</script>

<template>
  <header class="border-b border-slate-200/80 bg-white/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <NuxtLink
        to="/"
        class="inline-flex min-h-7 items-center gap-2.5 rounded-sm text-lg font-bold tracking-tight text-slate-950"
        :aria-label="$t('header.home')"
      >
        <span class="grid size-9 place-items-center rounded-xl bg-teal-700 text-white">
          <ScanLine :size="20" :stroke-width="2" aria-hidden="true" />
        </span>
        Korekto
      </NuxtLink>
      <div class="flex items-center gap-4">
        <span class="hidden text-sm font-medium text-slate-500 sm:block">{{
          $t('header.tagline')
        }}</span>
        <LanguageSwitcher />
      </div>
    </div>
  </header>
</template>
