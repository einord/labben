import { describe, it, expect } from 'vitest'
import { maskSensitiveEnvVars } from './env-mask'

describe('maskSensitiveEnvVars', () => {
  it('masks PASSWORD variables', () => {
    const result = maskSensitiveEnvVars(['DB_PASSWORD=supersecret', 'MYSQL_ROOT_PASSWORD=root123'])
    expect(result).toEqual(['DB_PASSWORD=****', 'MYSQL_ROOT_PASSWORD=****'])
  })

  it('masks SECRET variables', () => {
    const result = maskSensitiveEnvVars(['AUTH_SESSION_SECRET=abc123', 'JWT_SECRET=xyz'])
    expect(result).toEqual(['AUTH_SESSION_SECRET=****', 'JWT_SECRET=****'])
  })

  it('masks TOKEN variables', () => {
    const result = maskSensitiveEnvVars(['GITHUB_TOKEN=ghp_abc', 'ACCESS_TOKEN=tok123'])
    expect(result).toEqual(['GITHUB_TOKEN=****', 'ACCESS_TOKEN=****'])
  })

  it('masks API_KEY variables', () => {
    const result = maskSensitiveEnvVars(['OPENAI_API_KEY=sk-abc', 'SENDGRID_API_KEY=SG.xyz'])
    expect(result).toEqual(['OPENAI_API_KEY=****', 'SENDGRID_API_KEY=****'])
  })

  it('masks AUTH variables', () => {
    const result = maskSensitiveEnvVars(['BASIC_AUTH=user:pass'])
    expect(result).toEqual(['BASIC_AUTH=****'])
  })

  it('masks CREDENTIALS variables', () => {
    const result = maskSensitiveEnvVars(['GCP_CREDENTIALS={"key":"value"}'])
    expect(result).toEqual(['GCP_CREDENTIALS=****'])
  })

  it('masks PRIVATE_KEY variables', () => {
    const result = maskSensitiveEnvVars(['SSH_PRIVATE_KEY=-----BEGIN RSA-----'])
    expect(result).toEqual(['SSH_PRIVATE_KEY=****'])
  })

  it('does NOT mask non-sensitive variables', () => {
    const input = [
      'NODE_ENV=production',
      'PORT=3000',
      'DATABASE_URL=postgres://localhost/db',
      'TZ=Europe/Stockholm',
      'LANG=en_US.UTF-8',
    ]
    const result = maskSensitiveEnvVars(input)
    expect(result).toEqual(input)
  })

  it('is case-insensitive', () => {
    const result = maskSensitiveEnvVars(['db_password=secret', 'Api_Key=abc'])
    expect(result).toEqual(['db_password=****', 'Api_Key=****'])
  })

  it('handles empty array', () => {
    expect(maskSensitiveEnvVars([])).toEqual([])
  })

  it('preserves variable name and only masks value', () => {
    const result = maskSensitiveEnvVars(['MY_SECRET=value-with=equals'])
    expect(result).toEqual(['MY_SECRET=****'])
  })

  it('does not mask variables that just happen to contain KEY as substring', () => {
    const result = maskSensitiveEnvVars(['MONKEY=banana', 'HOTKEY=ctrl+c', 'KEYBOARD=us'])
    expect(result).toEqual(['MONKEY=banana', 'HOTKEY=ctrl+c', 'KEYBOARD=us'])
  })
})
