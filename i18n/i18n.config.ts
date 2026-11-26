const dateFormats = { short: { day: 'numeric', month: 'numeric', year: 'numeric' } } as const

export default defineI18nConfig(() => ({
  pluralRules: {
    // Czech: 1 → first form, 2–4 → second, everything else (0, 5+) → third.
    cs: (count: number) => (count === 1 ? 0 : count >= 2 && count <= 4 ? 1 : 2),
  },
  datetimeFormats: { cs: dateFormats, en: dateFormats },
}))
