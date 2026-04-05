import { describe, it, expect, beforeEach, vi } from 'vitest'
import { encrypt, decrypt, isEncrypted } from './crypto'

describe('crypto', () => {
  describe('encrypt / decrypt round-trip', () => {
    it('encrypts and decrypts a simple string', () => {
      const plaintext = 'my-secret-password'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts an empty string', () => {
      const encrypted = encrypt('')
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe('')
    })

    it('encrypts and decrypts unicode characters', () => {
      const plaintext = 'lösenord-with-émojis-🔑'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('produces different ciphertext each time (random IV)', () => {
      const plaintext = 'same-password'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)
      expect(encrypted1).not.toBe(encrypted2)
      expect(decrypt(encrypted1)).toBe(plaintext)
      expect(decrypt(encrypted2)).toBe(plaintext)
    })
  })

  describe('isEncrypted', () => {
    it('returns true for encrypted values', () => {
      const encrypted = encrypt('test')
      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('returns false for plaintext values', () => {
      expect(isEncrypted('plaintext-password')).toBe(false)
      expect(isEncrypted('')).toBe(false)
      expect(isEncrypted('changeme')).toBe(false)
    })
  })

  describe('decrypt edge cases', () => {
    it('returns null for non-encrypted input', () => {
      expect(decrypt('plaintext')).toBeNull()
    })

    it('returns null for malformed encrypted input', () => {
      expect(decrypt('enc:invalid')).toBeNull()
      expect(decrypt('enc:a:b')).toBeNull()
      expect(decrypt('enc::')).toBeNull()
    })

    it('returns null for corrupted ciphertext', () => {
      const encrypted = encrypt('test')
      const corrupted = encrypted.slice(0, -4) + 'xxxx'
      expect(decrypt(corrupted)).toBeNull()
    })
  })
})
