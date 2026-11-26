<script setup lang="ts">
import { assignments, classes, statusTone, submissions } from '~/preview/mocks'

definePageMeta({ layout: 'preview' })

const { t, d } = useI18n()
const route = useRoute()

const schoolClass = computed(() => classes.find((item) => item.id === route.params.classId))
const classAssignments = computed(() =>
  assignments.filter((assignment) => assignment.classId === route.params.classId),
)
</script>

<template>
  <div v-if="schoolClass">
    <NuxtLink to="/preview/teacher" class="text-sm text-primary-700 hover:underline">
      ← {{ t('classes.title') }}
    </NuxtLink>
    <h1 class="mt-2 text-2xl font-bold tracking-tight">
      {{ schoolClass.name }} · {{ schoolClass.subject }}
    </h1>

    <div class="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-4">
        <h2 class="font-semibold">{{ t('assignments.title') }}</h2>
        <UiCard v-for="assignment in classAssignments" :key="assignment.id">
          <div class="flex items-baseline justify-between gap-4">
            <h3 class="font-semibold">{{ assignment.title }}</h3>
            <div class="flex items-center gap-3">
              <span class="text-sm text-slate-500">
                {{ t('assignments.due', { date: d(new Date(assignment.dueDate), 'short') }) }}
              </span>
              <UiButton :to="`/preview/teacher/assignments/${assignment.id}/upload`">
                {{ t('upload.open') }}
              </UiButton>
            </div>
          </div>
          <ul class="mt-4 divide-y divide-slate-100">
            <li
              v-for="submission in submissions.filter((s) => s.assignmentId === assignment.id)"
              :key="submission.id"
              class="flex items-center justify-between py-2"
            >
              <span>{{ submission.studentName }}</span>
              <div class="flex items-center gap-3">
                <UiBadge :tone="statusTone[submission.status]">
                  {{ t(`submissions.status.${submission.status}`) }}
                </UiBadge>
                <UiButton
                  v-if="submission.status !== 'processing'"
                  variant="secondary"
                  :to="`/preview/teacher/submissions/${submission.id}`"
                >
                  {{ t('submissions.open') }}
                </UiButton>
              </div>
            </li>
          </ul>
        </UiCard>
      </section>

      <aside>
        <UiCard>
          <h2 class="font-semibold">{{ t('classes.students') }}</h2>
          <ul class="mt-3 space-y-1.5 text-slate-700">
            <li v-for="student in schoolClass.students" :key="student">{{ student }}</li>
          </ul>
        </UiCard>
      </aside>
    </div>
  </div>
</template>
