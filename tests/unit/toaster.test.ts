import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Toaster from '../../app/components/ui/Toaster.vue'

const mounted: { unmount: () => void }[] = []

async function mountToaster() {
  const wrapper = await mountSuspended(Toaster)
  mounted.push(wrapper)
  return wrapper
}

describe('Toaster', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    useToast().clear()
    await useNuxtApp().$i18n.setLocale('cs')
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.useRealTimers()
  })

  it('closes a toast after its duration', async () => {
    const wrapper = await mountToaster()
    useToast().success('Uloženo', { duration: 1000 })
    await nextTick()

    expect(wrapper.text()).toContain('Uloženo')
    vi.advanceTimersByTime(1000)
    expect(useToast().toasts.value).toEqual([])
  })

  it('pauses the timer while hovered', async () => {
    const wrapper = await mountToaster()
    useToast().success('Uloženo', { duration: 1000 })
    await nextTick()

    vi.advanceTimersByTime(600)
    await wrapper.get('li').trigger('mouseenter')
    vi.advanceTimersByTime(5000)
    expect(useToast().toasts.value).toHaveLength(1)

    await wrapper.get('li').trigger('mouseleave')
    vi.advanceTimersByTime(400)
    expect(useToast().toasts.value).toEqual([])
  })

  it('keeps loading toasts until they are updated, then starts the timer', async () => {
    await mountToaster()
    const toast = useToast()
    const id = toast.loading('Ukládám…')
    await nextTick()

    vi.advanceTimersByTime(60_000)
    expect(toast.toasts.value).toHaveLength(1)

    toast.update(id, 'success', 'Uloženo')
    await nextTick()
    vi.advanceTimersByTime(4000)
    expect(toast.toasts.value).toEqual([])
  })

  it('shows at most three toasts and counts the rest as queued', async () => {
    const wrapper = await mountToaster()
    const toast = useToast()
    for (const title of ['A', 'B', 'C', 'D', 'E']) toast.info(title, { duration: 0 })
    await nextTick()

    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(wrapper.text()).toContain('+2 v pořadí')
  })

  it('closes a toast with the close button', async () => {
    const wrapper = await mountToaster()
    useToast().error('Chyba')
    await nextTick()

    await wrapper.get('button[aria-label="Zavřít oznámení"]').trigger('click')
    expect(useToast().toasts.value).toEqual([])
  })
})
