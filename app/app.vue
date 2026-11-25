<script setup lang="ts">
const { t } = useI18n()
const localeHead = useLocaleHead({ seo: false })

useHead(() => ({
  htmlAttrs: { lang: localeHead.value.htmlAttrs.lang },
  title: t('meta.title'),
  meta: [{ name: 'description', content: t('meta.description') }],
}))
</script>

<template>
  <NuxtPage />
</template>
