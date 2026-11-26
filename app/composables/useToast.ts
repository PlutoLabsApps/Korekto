export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading'

export interface Toast {
  id: number
  type: ToastType
  title: string
  description?: string
  duration: number
}

export interface ToastOptions {
  description?: string
  duration?: number
}

export const MAX_VISIBLE_TOASTS = 3

const DEFAULT_DURATION: Record<ToastType, number> = {
  info: 4000,
  success: 4000,
  warning: 6000,
  error: 8000,
  loading: 0,
}

let nextId = 1

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function show(type: ToastType, title: string, options: ToastOptions = {}): number {
    const id = nextId++
    toasts.value.push({
      id,
      type,
      title,
      description: options.description,
      duration: options.duration ?? DEFAULT_DURATION[type],
    })
    return id
  }

  function update(id: number, type: ToastType, title: string, options: ToastOptions = {}): void {
    const toast = toasts.value.find((item) => item.id === id)
    if (!toast) return
    Object.assign(toast, {
      type,
      title,
      description: options.description,
      duration: options.duration ?? DEFAULT_DURATION[type],
    })
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  function clear(): void {
    toasts.value = []
  }

  async function promise<T>(
    action: Promise<T>,
    messages: { loading: string; success: string; error: string | ((error: unknown) => string) },
  ): Promise<T> {
    const id = show('loading', messages.loading)
    try {
      const result = await action
      update(id, 'success', messages.success)
      return result
    } catch (error) {
      update(
        id,
        'error',
        typeof messages.error === 'function' ? messages.error(error) : messages.error,
      )
      throw error
    }
  }

  return {
    toasts: readonly(toasts),
    show,
    update,
    dismiss,
    clear,
    promise,
    info: (title: string, options?: ToastOptions) => show('info', title, options),
    success: (title: string, options?: ToastOptions) => show('success', title, options),
    warning: (title: string, options?: ToastOptions) => show('warning', title, options),
    error: (title: string, options?: ToastOptions) => show('error', title, options),
    loading: (title: string, options?: ToastOptions) => show('loading', title, options),
  }
}
