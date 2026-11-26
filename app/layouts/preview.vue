<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
    <div class="bg-amber-100 px-5 py-2 text-center text-sm text-amber-900">
      {{ t('preview.banner') }}
    </div>
    <header class="border-b border-slate-200 bg-white">
      <nav class="mx-auto flex max-w-6xl items-center gap-5 px-5 py-4 text-sm font-medium sm:px-8">
        <NuxtLink to="/preview" class="font-bold text-slate-950">{{ t('preview.title') }}</NuxtLink>
        <NuxtLink to="/preview/teacher" class="text-slate-600 hover:text-slate-950">
          {{ t('roles.teacher') }}
        </NuxtLink>
        <NuxtLink to="/preview/student" class="text-slate-600 hover:text-slate-950">
          {{ t('roles.student') }}
        </NuxtLink>
        <NuxtLink to="/preview/toasts" class="text-slate-600 hover:text-slate-950">Toasty</NuxtLink>
        <NuxtLink to="/design" class="text-slate-600 hover:text-slate-950">Design</NuxtLink>
        <LanguageSwitcher class="ml-auto" />
      </nav>
    </header>
    <main class="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
      <slot />
    </main>
  </div>
</template>
