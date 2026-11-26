<script setup lang="ts">
import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert, X } from '@lucide/vue'
import type { Toast } from '~/composables/useToast'

const props = defineProps<{ toast: Readonly<Toast> }>()
const emit = defineEmits<{ dismiss: [] }>()

const { t } = useI18n()

const icons = {
  info: { icon: Info, class: 'text-primary-600' },
  success: { icon: CircleCheck, class: 'text-emerald-600' },
  warning: { icon: TriangleAlert, class: 'text-amber-500' },
  error: { icon: CircleX, class: 'text-red-600' },
  loading: { icon: LoaderCircle, class: 'animate-spin text-slate-500' },
}

const expanded = ref(false)
const overflowing = ref(false)
const singleLine = ref(true)
const title = ref<HTMLElement>()
const description = ref<HTMLElement>()

let timer: ReturnType<typeof setTimeout> | undefined
let remaining = 0
let startedAt = 0
let paused = false

function stopTimer() {
  clearTimeout(timer)
  timer = undefined
}

function runTimer() {
  stopTimer()
  if (remaining <= 0 || paused || expanded.value) return
  startedAt = Date.now()
  timer = setTimeout(() => emit('dismiss'), remaining)
}

function restartTimer() {
  remaining = props.toast.duration
  runTimer()
}

function pause() {
  if (!timer) return
  remaining -= Date.now() - startedAt
  paused = true
  stopTimer()
}

function resume() {
  paused = false
  runTimer()
}

async function measure() {
  await nextTick()
  const element = description.value
  overflowing.value = Boolean(element && element.scrollHeight > element.clientHeight + 1)
  const titleElement = title.value
  const lineHeight = titleElement ? parseFloat(getComputedStyle(titleElement).lineHeight) : 0
  singleLine.value =
    !props.toast.description && (!titleElement || titleElement.offsetHeight <= lineHeight * 1.5)
}

useResizeObserver(title, measure)

watch(
  () => [props.toast.type, props.toast.title, props.toast.description, props.toast.duration],
  () => {
    expanded.value = false
    restartTimer()
    measure()
  },
)

watch(expanded, (isExpanded) => (isExpanded ? pause() : resume()))

onMounted(() => {
  restartTimer()
  measure()
})
onBeforeUnmount(stopTimer)
</script>

<template>
  <li
    class="pointer-events-auto w-full border border-slate-200 bg-white text-sm shadow-lg shadow-slate-900/10 sm:w-auto sm:max-w-sm sm:min-w-72"
    :class="singleLine ? 'rounded-full' : 'rounded-xl'"
    :role="toast.type === 'error' ? 'alert' : 'status'"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <Transition name="toast-flip" mode="out-in">
      <div
        :key="toast.type"
        class="flex gap-3"
        :class="singleLine ? 'items-center py-2.5 pr-3 pl-4' : 'items-start p-3.5'"
      >
        <component
          :is="icons[toast.type].icon"
          :size="20"
          class="shrink-0"
          :class="[icons[toast.type].class, singleLine ? '' : 'mt-px']"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          <p ref="title" class="font-medium text-slate-900">{{ toast.title }}</p>
          <p
            v-if="toast.description"
            ref="description"
            class="mt-0.5 text-slate-600"
            :class="expanded ? '' : 'line-clamp-2'"
          >
            {{ toast.description }}
          </p>
          <button
            v-if="overflowing || expanded"
            type="button"
            class="mt-1 font-medium text-primary-700 hover:underline"
            @click="expanded = !expanded"
          >
            {{ expanded ? t('toast.less') : t('toast.more') }}
          </button>
        </div>
        <button
          v-if="toast.type !== 'loading'"
          type="button"
          class="-m-1 shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          :aria-label="t('toast.close')"
          @click="emit('dismiss')"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </li>
</template>

<style scoped>
.toast-flip-enter-active,
.toast-flip-leave-active {
  transition:
    transform 160ms ease,
    opacity 160ms ease;
}
.toast-flip-enter-from {
  transform: rotateX(-90deg);
  opacity: 0;
}
.toast-flip-leave-to {
  transform: rotateX(90deg);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .toast-flip-enter-active,
  .toast-flip-leave-active {
    transition: none;
  }
}
</style>
