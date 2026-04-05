import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'enc:'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/** Get or create a stable encryption key that survives HMR reloads */
function getEncryptionKey(): Buffer {
  const globalKey = '__labben_encryption_key'
  const g = globalThis as unknown as Record<string, Buffer | undefined>
  if (g[globalKey]) return g[globalKey]

  const secret = process.env.ENCRYPTION_SECRET
    || process.env.AUTH_SESSION_SECRET
    || 'labben-default-key-change-me'

  const key = scryptSync(secret, 'labben-salt', 32)
  g[globalKey] = key
  return key
}

/** Encrypt a plaintext string. Returns a prefixed string: `enc:<iv>:<authTag>:<ciphertext>` */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`
}

/** Decrypt an encrypted string. Returns null if the input is not encrypted. */
export function decrypt(value: string): string | null {
  if (!value.startsWith(PREFIX)) return null

  const parts = value.slice(PREFIX.length).split(':')
  if (parts.length !== 3) return null

  const ivHex = parts[0]!
  const authTagHex = parts[1]!
  const ciphertext = parts[2]!
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) return null

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    // Decryption failed (wrong key, corrupted data)
    return null
  }
}

/** Check if a value is already encrypted */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX)
}
