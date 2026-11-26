<script setup lang="ts">
import { Upload } from '@lucide/vue'
import { assignments, classes } from '~/preview/mocks'

definePageMeta({ layout: 'preview' })

const { t } = useI18n()
const route = useRoute()
const toast = useToast()

const assignment = computed(() => assignments.find((item) => item.id === route.params.assignmentId))
const students = computed(
  () => classes.find((item) => item.id === assignment.value?.classId)?.students ?? [],
)
const files = ref<{ name: string; student: string }[]>([])

function addFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const added = [...(input.files ?? [])].map((file, index) => ({
    name: file.name,
    student: students.value[(files.value.length + index) % students.value.length] ?? '',
  }))
  files.value.push(...added)
  input.value = ''
}

async function submit() {
  const classId = assignment.value?.classId
  await toast
    .promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: t('upload.uploading', files.value.length),
      success: t('upload.uploaded', files.value.length),
      error: t('errors.unexpected'),
    })
    .catch(() => {})
  await navigateTo(`/preview/teacher/classes/${classId}`)
}
</script>

<template>
  <div v-if="assignment">
    <NuxtLink
      :to="`/preview/teacher/classes/${assignment.classId}`"
      class="text-sm text-primary-700 hover:underline"
    >
      ← {{ assignment.title }}
    </NuxtLink>
    <h1 class="mt-2 text-2xl font-bold tracking-tight">{{ t('upload.title') }}</h1>

    <UiCard class="mt-6 space-y-5">
      <label
        class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-primary-400 hover:bg-primary-50/40"
      >
        <Upload :size="28" class="text-primary-600" aria-hidden="true" />
        <span class="font-medium">{{ t('upload.pick') }}</span>
        <span class="text-sm text-slate-500">{{ t('upload.formats') }}</span>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          class="sr-only"
          @change="addFiles"
        />
      </label>

      <ul v-if="files.length" class="divide-y divide-slate-100">
        <li
          v-for="(file, index) in files"
          :key="`${file.name}-${index}`"
          class="flex flex-wrap items-center justify-between gap-3 py-2"
        >
          <span class="truncate text-sm">{{ file.name }}</span>
          <select
            v-model="file.student"
            class="rounded-md border border-slate-300 px-2 py-1 text-sm"
            :aria-label="t('upload.student')"
          >
            <option v-for="student in students" :key="student" :value="student">
              {{ student }}
            </option>
          </select>
        </li>
      </ul>

      <div class="flex justify-end">
        <UiButton :disabled="!files.length" @click="submit">{{ t('upload.submit') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>
