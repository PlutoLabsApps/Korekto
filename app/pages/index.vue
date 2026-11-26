<script setup lang="ts">
import { ClipboardCheck, ShieldCheck, Sparkles, Upload } from '@lucide/vue'

const { t } = useI18n()

const features = computed(() => [
  {
    key: 'upload',
    title: t('home.features.upload.title'),
    description: t('home.features.upload.description'),
    icon: Upload,
    step: '01',
  },
  {
    key: 'ai',
    title: t('home.features.ai.title'),
    description: t('home.features.ai.description'),
    icon: Sparkles,
    step: '02',
  },
  {
    key: 'review',
    title: t('home.features.review.title'),
    description: t('home.features.review.description'),
    icon: ClipboardCheck,
    step: '03',
  },
])
</script>

<template>
  <main id="content" class="flex-1">
    <section class="relative isolate overflow-hidden" aria-labelledby="page-title">
      <div
        class="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-primary-100/70 to-transparent"
        aria-hidden="true"
      />
      <div
        class="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
      >
        <div>
          <p class="mb-5 text-sm font-semibold tracking-[0.16em] text-primary-700 uppercase">
            {{ t('home.eyebrow') }}
          </p>
          <h1
            id="page-title"
            class="text-[clamp(3.5rem,2rem+5vw,6rem)] leading-none font-bold tracking-[-0.055em] text-slate-950"
          >
            Korekto
          </h1>
          <p class="mt-6 max-w-2xl text-xl leading-8 font-medium text-slate-700 sm:text-2xl">
            {{ t('home.lead') }}
          </p>
          <p class="mt-5 max-w-xl leading-7 text-slate-600">
            {{ t('home.description') }}
          </p>
        </div>

        <aside
          class="rounded-3xl border border-primary-900/10 bg-slate-950 p-7 text-white shadow-xl shadow-primary-950/10 sm:p-8"
          :aria-label="t('home.principleLabel')"
        >
          <span
            class="grid size-12 place-items-center rounded-2xl bg-primary-400/15 text-primary-300"
          >
            <ShieldCheck :size="25" :stroke-width="1.8" aria-hidden="true" />
          </span>
          <p class="mt-8 text-2xl leading-9 font-semibold">{{ t('home.principleTitle') }}</p>
          <p class="mt-3 leading-7 text-slate-300">
            {{ t('home.principleText') }}
          </p>
        </aside>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24" aria-labelledby="workflow-title">
      <div class="mb-8 max-w-2xl">
        <h2
          id="workflow-title"
          class="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
        >
          {{ t('home.workflowTitle') }}
        </h2>
        <p class="mt-3 leading-7 text-slate-600">
          {{ t('home.workflowText') }}
        </p>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        <FeatureCard v-for="{ key, ...feature } in features" :key="key" v-bind="feature" />
      </div>
    </section>
  </main>
</template>
