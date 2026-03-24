export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

type ToastVariant = Toast['variant']

const DEFAULT_DURATION = 4000
const MAX_TOASTS = 5

/** Global toast notification system using Nuxt shared state */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  /** Add a toast and auto-remove it after the given duration */
  function addToast(message: string, variant: ToastVariant, duration = DEFAULT_DURATION): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const toast: Toast = { id, message, variant, duration }

    toasts.value.push(toast)

    // Enforce max visible toasts — remove oldest first
    while (toasts.value.length > MAX_TOASTS) {
      toasts.value.shift()
    }

    // Auto-dismiss after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)

    return id
  }

  /** Remove a toast by ID */
  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /** Convenience: show a success toast */
  function success(message: string) {
    return addToast(message, 'success')
  }

  /** Convenience: show an error toast */
  function error(message: string) {
    return addToast(message, 'error')
  }

  /** Convenience: show a warning toast */
  function warning(message: string) {
    return addToast(message, 'warning')
  }

  /** Convenience: show an info toast */
  function info(message: string) {
    return addToast(message, 'info')
  }

  return { toasts, addToast, removeToast, success, error, warning, info }
}
