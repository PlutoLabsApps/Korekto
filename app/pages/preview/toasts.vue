<script setup lang="ts">
import type { ToastType } from '~/composables/useToast'

definePageMeta({ layout: 'preview' })

const toast = useToast()
const types: ToastType[] = ['info', 'success', 'warning', 'error', 'loading']

const type = ref<ToastType>('success')
const title = ref('Změny byly uloženy')
const description = ref('')
const duration = ref('')
const actionFails = ref(false)

const longText =
  'Hodnocení se nepodařilo zveřejnit, protože u dvou kritérií chybí body. Doplňte je prosím a zkuste to znovu. Pokud problém přetrvá, zkontrolujte připojení k internetu nebo kontaktujte správce školy.'

function send() {
  toast.show(type.value, title.value || type.value, {
    description: description.value || undefined,
    duration: duration.value === '' ? undefined : Number(duration.value),
  })
}

function simulateAction() {
  const action = new Promise((resolve, reject) =>
    setTimeout(() => (actionFails.value ? reject(new Error('fail')) : resolve(null)), 1500),
  )
  toast
    .promise(action, {
      loading: 'Ukládám hodnocení…',
      success: 'Hodnocení bylo zveřejněno',
      error: 'Zveřejnění se nepodařilo',
    })
    .catch(() => {})
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <UiCard class="space-y-4">
      <h2 class="font-semibold">Vlastní toast</h2>
      <div>
        <span class="text-sm font-medium text-slate-800">Typ</span>
        <div class="mt-1.5 flex flex-wrap gap-2">
          <label
            v-for="item in types"
            :key="item"
            class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm"
            :class="type === item ? 'border-primary-600 bg-primary-50' : 'border-slate-300'"
          >
            <input v-model="type" type="radio" :value="item" />
            {{ item }}
          </label>
        </div>
      </div>
      <FormField id="toast-title" v-model="title" label="Nadpis" />
      <div>
        <label for="toast-description" class="block text-sm font-medium text-slate-800">
          Popis (volitelný)
        </label>
        <textarea
          id="toast-description"
          v-model="description"
          rows="3"
          class="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <button
          type="button"
          class="mt-1 text-sm text-primary-700 hover:underline"
          @click="description = longText"
        >
          Vložit dlouhý text
        </button>
      </div>
      <FormField
        id="toast-duration"
        v-model="duration"
        label="Délka v ms"
        hint="Prázdné = výchozí podle typu, 0 = nezmizí sám."
        type="number"
        min="0"
      />
      <div class="flex flex-wrap gap-2">
        <UiButton @click="send">Přidat do fronty</UiButton>
        <UiButton variant="secondary" @click="toast.clear()">Zavřít vše</UiButton>
      </div>
    </UiCard>

    <UiCard class="space-y-4">
      <h2 class="font-semibold">Akce: loading → výsledek</h2>
      <p class="text-sm text-slate-600">
        Jeden toast se zobrazí jako „loading“ a po 1,5 s se na místě změní na úspěch nebo chybu.
      </p>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="actionFails" type="checkbox" />
        Akce selže
      </label>
      <div class="flex flex-wrap gap-2">
        <UiButton @click="simulateAction">Spustit akci</UiButton>
        <UiButton
          variant="secondary"
          @click="
            types.filter((item) => item !== 'loading').forEach((item) => toast.show(item, item))
          "
        >
          Poslat 4 najednou
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>
