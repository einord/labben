import { ProjectLockError } from './errors'

const projectLocks = new Map<string, Promise<void>>()

/**
 * Acquire a per-project lock. Throws ProjectLockError if the project
 * already has an operation in progress (fail-fast, no queuing).
 */
export async function withProjectLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (projectLocks.has(name)) {
    throw new ProjectLockError(name)
  }
  const promise = fn()
  projectLocks.set(name, promise.then(() => {}, () => {}).finally(() => projectLocks.delete(name)))
  return promise
}
