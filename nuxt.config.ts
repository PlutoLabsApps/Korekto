import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-16',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'cs' },
      title: 'Korekto — hodnocení s lidskou kontrolou',
      meta: [
        {
          name: 'description',
          content:
            'Korekto propojuje nahrání žákovských prací, návrh AI hodnocení a kontrolu učitelem.',
        },
      ],
    },
  },
  runtimeConfig: {
    database: {
      url: '',
    },
    objectStorage: {
      endpoint: '',
      region: '',
      bucket: '',
      accessKeyId: '',
      secretAccessKey: '',
    },
    public: {
      siteName: 'Korekto',
      siteUrl: 'http://localhost:3000',
    },
  },
  typescript: {
    strict: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
