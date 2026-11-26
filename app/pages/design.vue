<script setup lang="ts">
definePageMeta({ layout: 'preview' })

const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const tones = ['neutral', 'primary', 'success', 'warning', 'danger'] as const
const value = ref('')
</script>

<template>
  <div class="space-y-10">
    <section>
      <h2 class="mb-3 font-semibold">Primary</h2>
      <div class="grid grid-cols-11 gap-2">
        <div v-for="shade in shades" :key="shade" class="text-center text-xs text-slate-500">
          <div class="h-12 rounded-lg" :style="{ background: `var(--color-primary-${shade})` }" />
          {{ shade }}
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-3 font-semibold">UiButton</h2>
      <div class="flex flex-wrap gap-3">
        <UiButton>Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="ghost">Ghost</UiButton>
        <UiButton disabled>Disabled</UiButton>
      </div>
    </section>

    <section>
      <h2 class="mb-3 font-semibold">UiBadge</h2>
      <div class="flex flex-wrap gap-3">
        <UiBadge v-for="tone in tones" :key="tone" :tone="tone">{{ tone }}</UiBadge>
      </div>
    </section>

    <section>
      <h2 class="mb-3 font-semibold">UiCard + FormField</h2>
      <UiCard class="max-w-sm space-y-4">
        <FormField id="design-default" v-model="value" label="Default" hint="Hint text" />
        <FormField id="design-error" v-model="value" label="Error" error="Error message" />
      </UiCard>
    </section>
  </div>
</template>
