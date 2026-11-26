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
  <UiCard as="article">
    <div class="mb-5 flex items-center justify-between">
      <span class="grid size-11 place-items-center rounded-xl bg-primary-50 text-primary-700">
        <component :is="icon" :size="22" :stroke-width="1.8" aria-hidden="true" />
      </span>
      <span class="text-xs font-bold tracking-[0.16em] text-slate-400">{{ step }}</span>
    </div>
    <h3 class="text-lg font-semibold text-slate-950">{{ title }}</h3>
    <p class="mt-2 leading-7 text-slate-600">{{ description }}</p>
  </UiCard>
</template>
