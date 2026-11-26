import { beforeEach, describe, expect, it } from 'vitest'

describe('useToast', () => {
  beforeEach(() => {
    useToast().clear()
  })

  it('adds toasts in order with default durations per type', () => {
    const toast = useToast()

    toast.success('Uloženo')
    toast.error('Chyba', { description: 'Detail' })
    toast.loading('Načítám')

    expect(
      toast.toasts.value.map(({ type, title, duration }) => ({ type, title, duration })),
    ).toEqual([
      { type: 'success', title: 'Uloženo', duration: 4000 },
      { type: 'error', title: 'Chyba', duration: 8000 },
      { type: 'loading', title: 'Načítám', duration: 0 },
    ])
    expect(toast.toasts.value[1]?.description).toBe('Detail')
  })

  it('updates a toast in place and resets its duration to the new type', () => {
    const toast = useToast()
    const id = toast.loading('Ukládám…')

    toast.update(id, 'success', 'Uloženo')

    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({
      id,
      type: 'success',
      title: 'Uloženo',
      duration: 4000,
    })
  })

  it('dismisses a single toast and clears all', () => {
    const toast = useToast()
    const first = toast.info('A')
    toast.info('B')

    toast.dismiss(first)
    expect(toast.toasts.value.map((item) => item.title)).toEqual(['B'])

    toast.clear()
    expect(toast.toasts.value).toEqual([])
  })

  it('turns a loading toast into success when the promise resolves', async () => {
    const toast = useToast()

    await expect(
      toast.promise(Promise.resolve(42), { loading: 'L', success: 'S', error: 'E' }),
    ).resolves.toBe(42)

    expect(toast.toasts.value).toEqual([expect.objectContaining({ type: 'success', title: 'S' })])
  })

  it('turns a loading toast into error and rethrows when the promise rejects', async () => {
    const toast = useToast()
    const failure = new Error('nope')

    await expect(
      toast.promise(Promise.reject(failure), {
        loading: 'L',
        success: 'S',
        error: (error) => `E: ${(error as Error).message}`,
      }),
    ).rejects.toBe(failure)

    expect(toast.toasts.value).toEqual([
      expect.objectContaining({ type: 'error', title: 'E: nope' }),
    ])
  })
})
