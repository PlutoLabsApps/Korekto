<script setup lang="ts">
const props = withDefaults(
  defineProps<{ tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }>(),
  { tone: 'neutral' },
)

const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary-800',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="tones[props.tone]"
  >
    <slot />
  </span>
</template>
