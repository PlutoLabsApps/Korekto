<script setup lang="ts">
import { assignments, submissions, totalPoints } from '~/preview/mocks'

definePageMeta({ layout: 'preview' })

const { t } = useI18n()

const published = submissions
  .filter((submission) => submission.status === 'published')
  .map((submission) => ({
    ...submission,
    assignment: assignments.find((item) => item.id === submission.assignmentId),
    total: totalPoints(submission.criteria),
  }))
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{{ t('results.title') }}</h1>
    <div class="mt-6 space-y-4">
      <UiCard v-for="result in published" :key="result.id">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="font-semibold">{{ result.assignment?.title }}</h2>
          <span class="text-lg font-bold">{{ result.total.points }} / {{ result.total.max }}</span>
        </div>
        <ul class="mt-3 space-y-1 text-sm text-slate-600">
          <li v-for="criterion in result.criteria" :key="criterion.name">
            <span class="font-medium text-slate-800">{{ criterion.name }}:</span>
            {{ criterion.aiFeedback }}
          </li>
        </ul>
        <p class="mt-3 text-slate-700">{{ result.overallFeedback }}</p>
        <UiButton variant="secondary" :to="`/preview/student/results/${result.id}`" class="mt-4">
          {{ t('results.detail') }}
        </UiButton>
      </UiCard>
    </div>
  </div>
</template>
