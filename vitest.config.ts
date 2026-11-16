import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    clearMocks: true,
    environment: 'nuxt',
    include: ['tests/unit/**/*.test.ts'],
  },
})
