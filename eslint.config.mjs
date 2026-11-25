import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Prettier owns formatting of void elements (`<input />`).
    'vue/html-self-closing': 'off',
  },
})
