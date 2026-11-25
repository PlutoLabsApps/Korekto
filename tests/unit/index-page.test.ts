import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import IndexPage from '../../app/pages/index.vue'

describe('home page', () => {
  beforeEach(async () => {
    await useNuxtApp().$i18n.setLocale('cs')
  })

  it('presents the teacher-controlled assessment workflow', async () => {
    const wrapper = await mountSuspended(IndexPage)

    expect(wrapper.get('h1').text()).toBe('Korekto')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('main').text()).toContain('Učitel má vždy poslední slovo')
    expect(wrapper.get('main').text()).toContain('Nahrání práce')
    expect(wrapper.get('main').text()).toContain('Návrh AI hodnocení')
    expect(wrapper.get('main').text()).toContain('Kontrola a zveřejnění')
  })

  it('renders in English when the locale is switched', async () => {
    await useNuxtApp().$i18n.setLocale('en')
    const wrapper = await mountSuspended(IndexPage)

    expect(wrapper.get('main').text()).toContain('The teacher always has the final say')
    expect(wrapper.get('main').text()).toContain('Upload work')
  })

  it('keeps decorative icons out of the accessibility tree', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const icons = wrapper.findAll('svg')

    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      expect(icon.attributes('aria-hidden')).toBe('true')
    }
  })
})
