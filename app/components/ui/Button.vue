<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    to?: RouteLocationRaw
    type?: 'button' | 'submit'
    block?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', to: undefined, type: 'button' },
)

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60',
  variants[props.variant],
  props.block && 'w-full',
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes"><slot /></NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes"><slot /></button>
</template>
