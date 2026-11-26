<script setup lang="ts">
import { MAX_VISIBLE_TOASTS } from '~/composables/useToast'

const { t } = useI18n()
const { toasts, dismiss } = useToast()

const visible = computed(() => toasts.value.slice(0, MAX_VISIBLE_TOASTS))
const queued = computed(() => Math.max(0, toasts.value.length - MAX_VISIBLE_TOASTS))
</script>

<template>
  <section
    :aria-label="t('toast.region')"
    class="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-stretch gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:inset-x-auto sm:top-auto sm:right-0 sm:bottom-0 sm:items-end sm:p-5"
  >
    <TransitionGroup
      tag="ol"
      name="toast"
      class="relative flex flex-col items-stretch gap-2 sm:items-end"
    >
      <UiToastItem
        v-for="toast in visible"
        :key="toast.id"
        :toast="toast"
        @dismiss="dismiss(toast.id)"
      />
    </TransitionGroup>
    <p
      v-if="queued"
      class="pointer-events-auto self-end rounded-full bg-slate-900/80 px-2.5 py-0.5 text-xs font-medium text-white"
    >
      {{ t('toast.queued', { count: queued }) }}
    </p>
  </section>
</template>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}
.toast-enter-from {
  transform: translateY(-12px);
  opacity: 0;
}
@media (min-width: 40rem) {
  .toast-enter-from {
    transform: translateY(12px);
  }
}
.toast-leave-to {
  transform: scale(0.96);
  opacity: 0;
}
.toast-leave-active {
  position: absolute;
}
@media (prefers-reduced-motion: reduce) {
  .toast-move,
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
