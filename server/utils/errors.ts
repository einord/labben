/** Check if a Docker error is a 404 (container/resource not found) */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('no such container')
}
