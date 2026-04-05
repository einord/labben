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
