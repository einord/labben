import { describe, it, expect } from 'vitest'
import { withProjectLock } from './project-lock'
import { ProjectLockError } from './errors'

describe('withProjectLock', () => {
  it('executes the function and returns its result', async () => {
    const result = await withProjectLock('test-project-1', async () => 'done')
    expect(result).toBe('done')
  })

  it('throws ProjectLockError when a second operation is attempted on the same project', async () => {
    let resolveFirst!: () => void
    const firstOp = withProjectLock('test-project-2', () => new Promise<void>((r) => { resolveFirst = r }))

    await expect(
      withProjectLock('test-project-2', async () => 'should not run'),
    ).rejects.toThrow(ProjectLockError)

    resolveFirst()
    await firstOp
  })

  it('releases the lock after the operation completes', async () => {
    await withProjectLock('test-project-3', async () => 'first')
    // Allow microtasks to settle (finally cleanup)
    await new Promise((r) => setTimeout(r, 0))
    const result = await withProjectLock('test-project-3', async () => 'second')
    expect(result).toBe('second')
  })

  it('releases the lock after the operation fails', async () => {
    await expect(
      withProjectLock('test-project-4', async () => { throw new Error('fail') }),
    ).rejects.toThrow('fail')
    // Allow microtasks to settle (finally cleanup)
    await new Promise((r) => setTimeout(r, 0))
    const result = await withProjectLock('test-project-4', async () => 'recovered')
    expect(result).toBe('recovered')
  })

  it('allows concurrent operations on different projects', async () => {
    let resolveA!: () => void
    let resolveB!: () => void
    const opA = withProjectLock('project-a', () => new Promise<void>((r) => { resolveA = r }))
    const opB = withProjectLock('project-b', () => new Promise<void>((r) => { resolveB = r }))

    // Both should be running without throwing
    resolveA()
    resolveB()
    await Promise.all([opA, opB])
  })
})
