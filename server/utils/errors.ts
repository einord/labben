/** Check if a Docker error is a 404 (container/resource not found) */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('no such container')
}

/** Check if a filesystem error is a file-not-found (ENOENT) */
export function isFileNotFoundError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'
}

/** Check if an error message indicates a resource already exists */
export function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('already exists')
}

/** Extract a meaningful error message from an unknown error (e.g. from external APIs) */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    // ofetch / $fetch errors have a data property with the upstream response
    if (e.data && typeof e.data === 'object') {
      const data = e.data as Record<string, unknown>
      if (typeof data.error === 'object' && data.error !== null) {
        const nested = data.error as Record<string, unknown>
        if (typeof nested.message === 'string') return nested.message
      }
      if (typeof data.message === 'string') return data.message
      if (typeof data.error === 'string') return data.error
    }
    if (typeof e.message === 'string' && e.message !== 'fetch failed') return e.message
    if (typeof e.statusMessage === 'string') return e.statusMessage
  }
  if (error instanceof Error) return error.message
  return fallback
}
