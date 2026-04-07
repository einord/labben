import { describe, it, expect } from 'vitest'
import { mkdirSync } from 'node:fs'

// Ensure database directory exists before importing services
process.env.DATA_DIR = '.data/db'
mkdirSync('.data/db', { recursive: true })

const { backupService } = await import('./backup')

describe('backupService', () => {
  describe('testDestination', () => {
    it('rejects paths outside /backups', async () => {
      const result = await backupService.testDestination('/etc/evil')
      expect(result).toBe(false)
    })

    it('rejects path traversal attempts', async () => {
      const result = await backupService.testDestination('/backups/../etc/evil')
      expect(result).toBe(false)
    })

    it('rejects root path', async () => {
      const result = await backupService.testDestination('/')
      expect(result).toBe(false)
    })

    it('rejects /data/compose path', async () => {
      const result = await backupService.testDestination('/data/compose')
      expect(result).toBe(false)
    })

    it('rejects paths that start with /backups but are not under it', async () => {
      const result = await backupService.testDestination('/backups-evil')
      expect(result).toBe(false)
    })
  })
})
