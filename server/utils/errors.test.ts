import { describe, it, expect } from 'vitest'
import { ProjectLockError } from './errors'

describe('ProjectLockError', () => {
  it('has the correct name', () => {
    const error = new ProjectLockError('my-project')
    expect(error.name).toBe('ProjectLockError')
  })

  it('includes the project name in the message', () => {
    const error = new ProjectLockError('my-project')
    expect(error.message).toBe("An operation is already in progress on project 'my-project'")
  })

  it('is an instance of Error', () => {
    const error = new ProjectLockError('test')
    expect(error).toBeInstanceOf(Error)
  })
})
