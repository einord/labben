/** Check if a fetch error is a 503 Docker unavailable response */
export function isDockerUnavailableResponse(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.statusCode === 503 || e.status === 503) return true
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>
      if (resp.status === 503) return true
    }
  }
  return false
}

/** Check if a fetch error is a 409 Conflict (operation already in progress) */
export function isConflictResponse(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.statusCode === 409 || e.status === 409) return true
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>
      if (resp.status === 409) return true
    }
  }
  return false
}

/** Extract a human-readable error message from a fetch error */
export function extractErrorDetails(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.data && typeof e.data === 'object') {
      const data = e.data as Record<string, unknown>
      if (typeof data.message === 'string') return data.message
      if (typeof data.statusMessage === 'string') return data.statusMessage
    }
    if (typeof e.message === 'string') return e.message
    if (typeof e.statusMessage === 'string') return e.statusMessage
  }
  return String(err)
}
