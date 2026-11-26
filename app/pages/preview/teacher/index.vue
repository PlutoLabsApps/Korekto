<script setup lang="ts">
import { assignments, classes } from '~/preview/mocks'

definePageMeta({ layout: 'preview' })

const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{{ t('classes.title') }}</h1>
    <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink v-for="item in classes" :key="item.id" :to="`/preview/teacher/classes/${item.id}`">
        <UiCard class="h-full hover:border-primary-300">
          <p class="text-sm text-slate-500">{{ item.subject }}</p>
          <h2 class="mt-1 text-xl font-semibold">{{ item.name }}</h2>
          <p class="mt-4 text-sm text-slate-600">
            {{ t('classes.studentCount', item.students.length) }} ·
            {{
              t('classes.assignmentCount', assignments.filter((a) => a.classId === item.id).length)
            }}
          </p>
        </UiCard>
      </NuxtLink>
    </div>
  </div>
</template>
