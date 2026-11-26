<script setup lang="ts">
import { assignments, statusTone, submissions } from '~/preview/mocks'

definePageMeta({ layout: 'preview' })

const { t } = useI18n()
const route = useRoute()

const submission = computed(() => submissions.find((item) => item.id === route.params.submissionId))
const assignment = computed(() =>
  assignments.find((item) => item.id === submission.value?.assignmentId),
)
const points = ref<number[]>(
  submission.value?.criteria.map((criterion) => criterion.aiPoints) ?? [],
)
const feedback = ref(submission.value?.overallFeedback ?? '')
const total = computed(() => points.value.reduce((sum, value) => sum + Number(value), 0))
const max = computed(
  () => submission.value?.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0) ?? 0,
)
</script>

<template>
  <div v-if="submission && assignment">
    <NuxtLink
      :to="`/preview/teacher/classes/${assignment.classId}`"
      class="text-sm text-primary-700 hover:underline"
    >
      ← {{ assignment.title }}
    </NuxtLink>
    <div class="mt-2 flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-bold tracking-tight">{{ submission.studentName }}</h1>
      <UiBadge :tone="statusTone[submission.status]">
        {{ t(`submissions.status.${submission.status}`) }}
      </UiBadge>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <UiCard>
        <h2 class="font-semibold">{{ t('review.recognizedText') }}</h2>
        <div
          class="mt-3 grid aspect-[4/3] place-items-center rounded-lg bg-slate-100 text-sm text-slate-500"
        >
          {{ t('review.scanPlaceholder') }}
        </div>
        <pre class="mt-4 font-sans text-sm leading-7 whitespace-pre-wrap text-slate-700">{{
          submission.recognizedText
        }}</pre>
      </UiCard>

      <UiCard>
        <h2 class="font-semibold">{{ t('review.aiSuggestion') }}</h2>
        <ul class="mt-4 space-y-4">
          <li
            v-for="(criterion, index) in submission.criteria"
            :key="criterion.name"
            class="rounded-lg border p-4"
            :class="criterion.uncertain ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-medium">{{ criterion.name }}</span>
              <label class="flex items-center gap-2 text-sm">
                <input
                  v-model.number="points[index]"
                  type="number"
                  min="0"
                  :max="criterion.maxPoints"
                  class="w-16 rounded-md border border-slate-300 px-2 py-1 text-right"
                  :aria-label="t('review.points')"
                />
                / {{ criterion.maxPoints }}
              </label>
            </div>
            <p class="mt-2 text-sm text-slate-600">{{ criterion.aiFeedback }}</p>
            <UiBadge v-if="criterion.uncertain" tone="warning" class="mt-2">
              {{ t('review.uncertain') }}
            </UiBadge>
          </li>
        </ul>

        <label class="mt-5 block text-sm font-medium" for="feedback">{{
          t('review.feedback')
        }}</label>
        <textarea
          id="feedback"
          v-model="feedback"
          rows="3"
          class="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
        />

        <div class="mt-5 flex items-center justify-between gap-3">
          <span class="font-semibold">{{ t('review.total', { points: total, max }) }}</span>
          <div class="flex gap-2">
            <UiButton variant="secondary" :to="`/preview/teacher/classes/${assignment.classId}`">
              {{ t('review.reject') }}
            </UiButton>
            <UiButton :to="`/preview/teacher/classes/${assignment.classId}`">
              {{ t('review.approve') }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
