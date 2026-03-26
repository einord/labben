export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration: number
  /** Optional error details shown on expand */
  details?: string
  /** Whether this toast persists until manually dismissed */
  persistent: boolean
}

type ToastVariant = Toast['variant']

const DEFAULT_DURATION = 4000
const MAX_TOASTS = 5

/** Global toast notification system using Nuxt shared state */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  /** Add a toast and auto-remove it after the given duration (unless persistent) */
  function addToast(message: string, variant: ToastVariant, options?: { duration?: number; details?: string; persistent?: boolean }): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const persistent = options?.persistent ?? variant === 'error'
    const duration = persistent ? 0 : (options?.duration ?? DEFAULT_DURATION)
    const toast: Toast = { id, message, variant, duration, details: options?.details, persistent }

    toasts.value.push(toast)

    // Enforce max visible toasts — remove oldest first
    while (toasts.value.length > MAX_TOASTS) {
      toasts.value.shift()
    }

    // Auto-dismiss after duration (unless persistent)
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

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

  /** Convenience: show an error toast (persistent by default, with optional details) */
  function error(message: string, details?: string) {
    return addToast(message, 'error', { details })
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
