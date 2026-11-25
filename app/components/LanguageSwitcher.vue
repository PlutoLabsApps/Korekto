<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
</script>

<template>
  <div class="flex items-center gap-1 text-sm" role="group" :aria-label="$t('header.language')">
    <button
      v-for="item in locales"
      :key="item.code"
      type="button"
      class="rounded-md px-2 py-1 font-medium uppercase"
      :class="
        item.code === locale ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
      "
      :aria-pressed="item.code === locale"
      :lang="item.language"
      :title="item.name"
      @click="setLocale(item.code)"
    >
      {{ item.code }}
    </button>
  </div>
</template>
