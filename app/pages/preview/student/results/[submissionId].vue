<script setup lang="ts">
import { assignments, submissions, totalPoints } from '~/preview/mocks'

definePageMeta({ layout: 'preview' })

const { t } = useI18n()
const route = useRoute()
const toast = useToast()

const result = computed(() => submissions.find((item) => item.id === route.params.submissionId))
const assignment = computed(() =>
  assignments.find((item) => item.id === result.value?.assignmentId),
)
const total = computed(() => totalPoints(result.value?.criteria ?? []))

const appealOpen = ref(false)
const appealText = ref('')
const appealSent = ref(false)

async function sendAppeal() {
  await toast
    .promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: t('appeal.sending'),
      success: t('appeal.sent'),
      error: t('errors.unexpected'),
    })
    .catch(() => {})
  appealSent.value = true
  appealOpen.value = false
}
</script>

<template>
  <div v-if="result && assignment">
    <NuxtLink to="/preview/student" class="text-sm text-primary-700 hover:underline">
      ← {{ t('results.title') }}
    </NuxtLink>
    <div class="mt-2 flex flex-wrap items-baseline justify-between gap-3">
      <h1 class="text-2xl font-bold tracking-tight">{{ assignment.title }}</h1>
      <span class="text-2xl font-bold">{{ total.points }} / {{ total.max }}</span>
    </div>

    <UiCard class="mt-6">
      <ul class="divide-y divide-slate-100">
        <li v-for="criterion in result.criteria" :key="criterion.name" class="py-3">
          <div class="flex justify-between gap-3 font-medium">
            <span>{{ criterion.name }}</span>
            <span>{{ criterion.aiPoints }} / {{ criterion.maxPoints }}</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">{{ criterion.aiFeedback }}</p>
        </li>
      </ul>
      <p class="mt-4 rounded-lg bg-slate-50 p-4 text-slate-700">{{ result.overallFeedback }}</p>
    </UiCard>

    <UiCard class="mt-6">
      <div v-if="appealSent" class="flex items-center gap-3">
        <UiBadge tone="warning">{{ t('appeal.pending') }}</UiBadge>
        <span class="text-sm text-slate-600">{{ appealText }}</span>
      </div>
      <form v-else-if="appealOpen" class="space-y-3" @submit.prevent="sendAppeal">
        <label for="appeal" class="block text-sm font-medium">{{ t('appeal.reason') }}</label>
        <textarea
          id="appeal"
          v-model="appealText"
          rows="3"
          class="block w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <div class="flex justify-end gap-2">
          <UiButton variant="secondary" @click="appealOpen = false">{{
            t('appeal.cancel')
          }}</UiButton>
          <UiButton type="submit" :disabled="!appealText.trim()">{{ t('appeal.submit') }}</UiButton>
        </div>
      </form>
      <div v-else class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-600">{{ t('appeal.prompt') }}</p>
        <UiButton variant="secondary" @click="appealOpen = true">{{ t('appeal.open') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>
