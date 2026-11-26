<script setup lang="ts">
withDefaults(defineProps<{ as?: string }>(), { as: 'div' })
</script>

<template>
  <component
    :is="as"
    class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
  >
    <slot />
  </component>
</template>
