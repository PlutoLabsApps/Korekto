<script setup lang="ts">
defineProps<{
  id: string
  label: string
  error?: string
  hint?: string
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-800">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      class="mt-1.5 block w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-primary-600"
      :class="error ? 'border-red-500' : 'border-slate-300'"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
    />
    <p v-if="error" :id="`${id}-error`" class="mt-1.5 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1.5 text-sm text-slate-500">{{ hint }}</p>
  </div>
</template>
