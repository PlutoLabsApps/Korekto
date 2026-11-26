<script setup lang="ts">
definePageMeta({ layout: 'preview' })

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2">
    <UiCard>
      <h2 class="text-lg font-semibold">{{ t('roles.teacher') }}</h2>
      <p class="mt-2 text-slate-600">{{ t('preview.teacherFlow') }}</p>
      <UiButton to="/preview/teacher" class="mt-5">{{ t('preview.open') }}</UiButton>
    </UiCard>
    <UiCard>
      <h2 class="text-lg font-semibold">{{ t('roles.student') }}</h2>
      <p class="mt-2 text-slate-600">{{ t('preview.studentFlow') }}</p>
      <UiButton to="/preview/student" class="mt-5">{{ t('preview.open') }}</UiButton>
    </UiCard>
  </div>
</template>
