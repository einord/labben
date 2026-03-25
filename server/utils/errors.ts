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
