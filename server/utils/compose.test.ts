import { describe, it, expect } from 'vitest'
import { validateComposeYaml, ComposeValidationError } from './compose'

describe('validateComposeYaml', () => {
  it('accepts valid compose YAML', () => {
    const yaml = `
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
`
    expect(() => validateComposeYaml(yaml)).not.toThrow()
  })

  it('accepts minimal valid YAML object', () => {
    expect(() => validateComposeYaml('name: my-project')).not.toThrow()
  })

  it('accepts empty object', () => {
    expect(() => validateComposeYaml('{}')).not.toThrow()
  })

  it('rejects invalid YAML syntax', () => {
    const invalid = `
services:
  web:
    image: nginx
    ports:
  - "80:80"
  bad_indent
`
    expect(() => validateComposeYaml(invalid)).toThrow(ComposeValidationError)
    expect(() => validateComposeYaml(invalid)).toThrow(/Invalid YAML syntax/)
  })

  it('rejects null/empty YAML', () => {
    expect(() => validateComposeYaml('')).toThrow(ComposeValidationError)
    expect(() => validateComposeYaml('')).toThrow(/must be a YAML mapping/)
  })

  it('rejects scalar YAML', () => {
    expect(() => validateComposeYaml('just a string')).toThrow(ComposeValidationError)
    expect(() => validateComposeYaml('just a string')).toThrow(/must be a YAML mapping/)
  })

  it('rejects array YAML', () => {
    expect(() => validateComposeYaml('- item1\n- item2')).toThrow(ComposeValidationError)
    expect(() => validateComposeYaml('- item1\n- item2')).toThrow(/must be a YAML mapping/)
  })

  it('rejects numeric YAML', () => {
    expect(() => validateComposeYaml('42')).toThrow(ComposeValidationError)
    expect(() => validateComposeYaml('42')).toThrow(/must be a YAML mapping/)
  })

  it('throws ComposeValidationError, not generic Error', () => {
    try {
      validateComposeYaml('- not: valid\n  compose: [')
    } catch (err) {
      expect(err).toBeInstanceOf(ComposeValidationError)
      expect(err).not.toBeInstanceOf(TypeError)
      return
    }
    expect.fail('Expected ComposeValidationError to be thrown')
  })
})
