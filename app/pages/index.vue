<script setup lang="ts">
import { ClipboardCheck, ShieldCheck, Sparkles, Upload } from '@lucide/vue'

const features = [
  {
    title: 'Nahrání práce',
    description: 'Fotografie, sken nebo PDF se bezpečně přiřadí ke žákovi a zadání.',
    icon: Upload,
    step: '01',
  },
  {
    title: 'Návrh AI hodnocení',
    description: 'AI připraví body, zpětnou vazbu a označí místa, kde si není jistá.',
    icon: Sparkles,
    step: '02',
  },
  {
    title: 'Kontrola a zveřejnění',
    description: 'Učitel upraví a schválí výsledek. Žákovi se zobrazí až finální hodnocení.',
    icon: ClipboardCheck,
    step: '03',
  },
]
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
    <AppHeader />

    <main id="content" class="flex-1">
      <section class="relative isolate overflow-hidden" aria-labelledby="page-title">
        <div
          class="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-teal-100/70 to-transparent"
          aria-hidden="true"
        />
        <div
          class="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
        >
          <div>
            <p class="mb-5 text-sm font-semibold tracking-[0.16em] text-teal-700 uppercase">
              Hodnocení s lidskou kontrolou
            </p>
            <h1
              id="page-title"
              class="text-[clamp(3.5rem,2rem+5vw,6rem)] leading-none font-bold tracking-[-0.055em] text-slate-950"
            >
              Korekto
            </h1>
            <p class="mt-6 max-w-2xl text-xl leading-8 font-medium text-slate-700 sm:text-2xl">
              Méně času na opravování. Více času na smysluplnou zpětnou vazbu.
            </p>
            <p class="mt-5 max-w-xl leading-7 text-slate-600">
              Společný základ pro třídy, zadání a žákovské práce — od nahrání až po výsledek, který
              učitel skutečně posoudil.
            </p>
          </div>

          <aside
            class="rounded-3xl border border-teal-900/10 bg-slate-950 p-7 text-white shadow-xl shadow-teal-950/10 sm:p-8"
            aria-label="Zásada Korekto"
          >
            <span class="grid size-12 place-items-center rounded-2xl bg-teal-400/15 text-teal-300">
              <ShieldCheck :size="25" :stroke-width="1.8" aria-hidden="true" />
            </span>
            <p class="mt-8 text-2xl leading-9 font-semibold">Učitel má vždy poslední slovo</p>
            <p class="mt-3 leading-7 text-slate-300">
              Žádný návrh AI se nezveřejní bez aktivní kontroly a schválení učitelem.
            </p>
          </aside>
        </div>
      </section>

      <section
        class="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24"
        aria-labelledby="workflow-title"
      >
        <div class="mb-8 max-w-2xl">
          <h2
            id="workflow-title"
            class="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
          >
            Od práce k výsledku bez zkratů
          </h2>
          <p class="mt-3 leading-7 text-slate-600">
            Tři kroky, u kterých zůstává odpovědnost vždy jasná.
          </p>
        </div>
        <div class="grid gap-5 md:grid-cols-3">
          <FeatureCard v-for="feature in features" :key="feature.title" v-bind="feature" />
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>
