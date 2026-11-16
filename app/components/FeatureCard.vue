<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  description: string
  icon: Component
  step: string
}>()
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
    <div class="mb-5 flex items-center justify-between">
      <span class="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
        <component :is="icon" :size="22" :stroke-width="1.8" aria-hidden="true" />
      </span>
      <span class="text-xs font-bold tracking-[0.16em] text-slate-400">{{ step }}</span>
    </div>
    <h3 class="text-lg font-semibold text-slate-950">{{ title }}</h3>
    <p class="mt-2 leading-7 text-slate-600">{{ description }}</p>
  </article>
</template>
