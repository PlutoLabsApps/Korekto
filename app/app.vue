<script setup lang="ts">
const { t } = useI18n()
const localeHead = useLocaleHead({ seo: false })

useHead(() => ({
  htmlAttrs: { lang: localeHead.value.htmlAttrs.lang },
  titleTemplate: (title) => (title ? `${title} · Korekto` : t('meta.title')),
  meta: [{ name: 'description', content: t('meta.description') }],
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
