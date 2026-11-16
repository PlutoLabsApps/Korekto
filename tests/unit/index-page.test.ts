import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '../../app/pages/index.vue'

describe('home page', () => {
  it('presents the teacher-controlled assessment workflow', async () => {
    const wrapper = await mountSuspended(IndexPage)

    expect(wrapper.get('h1').text()).toBe('Korekto')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('main').text()).toContain('Učitel má vždy poslední slovo')
    expect(wrapper.get('main').text()).toContain('Nahrání práce')
    expect(wrapper.get('main').text()).toContain('Návrh AI hodnocení')
    expect(wrapper.get('main').text()).toContain('Kontrola a zveřejnění')
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
