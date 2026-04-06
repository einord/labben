import Database from 'better-sqlite3'
import { accessSync, constants, statSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ProjectGroup, ProjectMetadata } from '~/types/project'
import type { User } from '~/types/auth'
import type { BackupConfig, BackupHistoryEntry } from '~/types/backup'
import type { StaticSite, UpdateStaticSiteData } from '~/types/static-sites'

class DatabaseService {
  private db: Database.Database
  private dataDir: string

  constructor() {
    this.dataDir = process.env.NODE_ENV === 'production' ? '/data/db' : (process.env.DATA_DIR || 'data')
    const dbPath = resolve(this.dataDir, 'labben.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')

    // Verify data directory is writable and likely a mounted volume in production
    this.validateDataDir()

    this.createTables()
  }

  /** Log warnings if the data directory has issues (not writable, not mounted in production). */
  private validateDataDir(): void {
    try {
      accessSync(this.dataDir, constants.W_OK)
    } catch {
      console.warn(`[database] WARNING: Data directory "${this.dataDir}" is not writable. Database changes may fail.`)
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        const dirStat = statSync(this.dataDir)
        const parentStat = statSync(resolve(this.dataDir, '..'))
        if (dirStat.dev === parentStat.dev) {
          console.warn('[database] WARNING: Data directory does not appear to be a mounted volume. Data will be lost on container restart. Mount a volume to /data/db.')
        }
      } catch {
        // Can't check — don't warn
      }
    }
  }

  /** Check database directory health for system status reporting. */
  checkHealth(): { writable: boolean; mounted: boolean } {
    let writable = false
    // Mount check only applies in production; in dev, assume mounted
    let mounted = true

    try {
      accessSync(this.dataDir, constants.W_OK)
      writable = true
    } catch {
      writable = false
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        const dirStat = statSync(this.dataDir)
        const parentStat = statSync(resolve(this.dataDir, '..'))
        mounted = dirStat.dev !== parentStat.dev
      } catch {
        mounted = false
      }
    }

    return { writable, mounted }
  }

  /** Create tables if they don't exist */
  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS project_metadata (
        name TEXT PRIMARY KEY,
        group_id INTEGER,
        display_name TEXT,
        role TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS webauthn_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        public_key BLOB NOT NULL,
        counter INTEGER NOT NULL DEFAULT 0,
        device_type TEXT,
        backed_up INTEGER NOT NULL DEFAULT 0,
        transports TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS invite_tokens (
        token TEXT PRIMARY KEY,
        created_by TEXT NOT NULL,
        used_by TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS backup_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        destination TEXT NOT NULL,
        schedule_days TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
        schedule_hour INTEGER NOT NULL DEFAULT 3,
        schedule_minute INTEGER NOT NULL DEFAULT 0,
        retention_count INTEGER NOT NULL DEFAULT 30,
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS static_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT NOT NULL UNIQUE,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS backup_history (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        size_bytes INTEGER,
        error_message TEXT
      );
    `)
    this.migrate()
  }

  /** Run schema migrations based on user_version pragma */
  private migrate(): void {
    const version = (this.db.pragma('user_version', { simple: true }) as number) ?? 0

    if (version < 1) {
      // Add role column if upgrading from initial schema
      const columns = this.db.prepare("PRAGMA table_info('project_metadata')").all() as Array<{ name: string }>
      const hasRole = columns.some(c => c.name === 'role')
      if (!hasRole) {
        this.db.exec('ALTER TABLE project_metadata ADD COLUMN role TEXT')
      }
      this.db.pragma('user_version = 1')
    }

    if (version < 2) {
      // Tables are created with IF NOT EXISTS, so this is safe
      this.db.pragma('user_version = 2')
    }

    if (version < 3) {
      this.db.pragma('user_version = 3')
    }
  }

  // -- Groups --

  /** Get all groups ordered by sort_order */
  getAllGroups(): ProjectGroup[] {
    const rows = this.db.prepare(
      'SELECT id, name, sort_order as sortOrder FROM groups ORDER BY sort_order, name',
    ).all() as ProjectGroup[]
    return rows
  }

  /** Get a single group by ID */
  getGroup(id: number): ProjectGroup | null {
    const row = this.db.prepare(
      'SELECT id, name, sort_order as sortOrder FROM groups WHERE id = ?',
    ).get(id) as ProjectGroup | undefined
    return row ?? null
  }

  /** Create a new group */
  createGroup(name: string): ProjectGroup {
    const maxOrder = this.db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM groups',
    ).get() as { next: number }

    const result = this.db.prepare(
      'INSERT INTO groups (name, sort_order) VALUES (?, ?)',
    ).run(name, maxOrder.next)

    return { id: Number(result.lastInsertRowid), name, sortOrder: maxOrder.next }
  }

  /** Update a group's name and/or sort order */
  updateGroup(id: number, data: { name?: string; sortOrder?: number }): ProjectGroup {
    const current = this.getGroup(id)
    if (!current) throw new Error(`Group not found: ${id}`)

    const name = data.name ?? current.name
    const sortOrder = data.sortOrder ?? current.sortOrder

    this.db.prepare(
      'UPDATE groups SET name = ?, sort_order = ? WHERE id = ?',
    ).run(name, sortOrder, id)

    return { id, name, sortOrder }
  }

  /** Delete a group (projects become ungrouped via ON DELETE SET NULL) */
  deleteGroup(id: number): void {
    const result = this.db.prepare('DELETE FROM groups WHERE id = ?').run(id)
    if (result.changes === 0) throw new Error(`Group not found: ${id}`)
  }

  // -- Project metadata --

  /** Get all project metadata as a Map keyed by project name */
  getAllProjectMetadata(): Map<string, ProjectMetadata> {
    const rows = this.db.prepare(`
      SELECT
        pm.name,
        pm.group_id as groupId,
        g.name as groupName,
        pm.display_name as displayName,
        pm.role as role
      FROM project_metadata pm
      LEFT JOIN groups g ON pm.group_id = g.id
    `).all() as Array<{ name: string; groupId: number | null; groupName: string | null; displayName: string | null; role: string | null }>

    const map = new Map<string, ProjectMetadata>()
    for (const row of rows) {
      map.set(row.name, {
        groupId: row.groupId,
        groupName: row.groupName,
        displayName: row.displayName,
        role: row.role,
      })
    }
    return map
  }

  /** Create or update metadata for a project */
  upsertProjectMetadata(name: string, data: { groupId?: number | null; displayName?: string | null; role?: string | null }): void {
    const existing = this.db.prepare(
      'SELECT name FROM project_metadata WHERE name = ?',
    ).get(name) as { name: string } | undefined

    if (existing) {
      const updates: string[] = []
      const values: unknown[] = []

      if (data.groupId !== undefined) {
        updates.push('group_id = ?')
        values.push(data.groupId)
      }
      if (data.displayName !== undefined) {
        updates.push('display_name = ?')
        values.push(data.displayName)
      }
      if (data.role !== undefined) {
        updates.push('role = ?')
        values.push(data.role)
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')")
        values.push(name)
        this.db.prepare(
          `UPDATE project_metadata SET ${updates.join(', ')} WHERE name = ?`,
        ).run(...values)
      }
    } else {
      this.db.prepare(
        'INSERT INTO project_metadata (name, group_id, display_name, role) VALUES (?, ?, ?, ?)',
      ).run(name, data.groupId ?? null, data.displayName ?? null, data.role ?? null)
    }
  }

  /** Delete metadata for a project */
  deleteProjectMetadata(name: string): void {
    this.db.prepare('DELETE FROM project_metadata WHERE name = ?').run(name)
  }

  // -- Settings --

  /** Get a setting value by key */
  getSetting(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  /** Set a setting value */
  setSetting(key: string, value: string): void {
    this.db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    ).run(key, value, value)
  }

  /** Delete a setting */
  deleteSetting(key: string): void {
    this.db.prepare('DELETE FROM settings WHERE key = ?').run(key)
  }

  /** Clear the role for all projects that have a specific role */
  clearRole(role: string): void {
    this.db.prepare("UPDATE project_metadata SET role = NULL, updated_at = datetime('now') WHERE role = ?").run(role)
  }

  // -- Users --

  /** Get the total number of registered users */
  getUserCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    return row.count
  }

  /** Create a new user */
  createUser(id: string, username: string, displayName: string): User {
    this.db.prepare(
      'INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)',
    ).run(id, username, displayName)
    return { id, username, displayName }
  }

  /** Get a user by ID */
  getUserById(id: string): User | null {
    const row = this.db.prepare(
      'SELECT id, username, display_name as displayName FROM users WHERE id = ?',
    ).get(id) as User | undefined
    return row ?? null
  }

  /** Get a user by username */
  getUserByUsername(username: string): User | null {
    const row = this.db.prepare(
      'SELECT id, username, display_name as displayName FROM users WHERE username = ?',
    ).get(username) as User | undefined
    return row ?? null
  }

  /** Get all users */
  getAllUsers(): User[] {
    return this.db.prepare(
      'SELECT id, username, display_name as displayName FROM users ORDER BY created_at',
    ).all() as User[]
  }

  /** Delete a user and their credentials */
  deleteUser(id: string): void {
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id)
  }

  // -- WebAuthn Credentials --

  /** Store a new WebAuthn credential */
  addCredential(data: {
    id: string
    userId: string
    publicKey: Buffer
    counter: number
    deviceType: string | null
    backedUp: boolean
    transports: string | null
  }): void {
    this.db.prepare(
      'INSERT INTO webauthn_credentials (id, user_id, public_key, counter, device_type, backed_up, transports) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(data.id, data.userId, data.publicKey, data.counter, data.deviceType, data.backedUp ? 1 : 0, data.transports)
  }

  /** Get a credential by ID */
  getCredentialById(id: string): { id: string; userId: string; publicKey: Buffer; counter: number; deviceType: string | null; backedUp: boolean; transports: string | null } | null {
    const row = this.db.prepare(
      'SELECT id, user_id as userId, public_key as publicKey, counter, device_type as deviceType, backed_up as backedUp, transports FROM webauthn_credentials WHERE id = ?',
    ).get(id) as { id: string; userId: string; publicKey: Buffer; counter: number; deviceType: string | null; backedUp: number; transports: string | null } | undefined
    if (!row) return null
    return { ...row, backedUp: row.backedUp === 1 }
  }

  /** Get all credentials for a user */
  getCredentialsByUserId(userId: string): Array<{ id: string; userId: string; publicKey: Buffer; counter: number; deviceType: string | null; backedUp: boolean; transports: string | null; createdAt: string }> {
    const rows = this.db.prepare(
      'SELECT id, user_id as userId, public_key as publicKey, counter, device_type as deviceType, backed_up as backedUp, transports, created_at as createdAt FROM webauthn_credentials WHERE user_id = ?',
    ).all(userId) as Array<{ id: string; userId: string; publicKey: Buffer; counter: number; deviceType: string | null; backedUp: number; transports: string | null; createdAt: string }>
    return rows.map(r => ({ ...r, backedUp: r.backedUp === 1 }))
  }

  /** Update the counter for a credential */
  updateCredentialCounter(id: string, counter: number): void {
    this.db.prepare('UPDATE webauthn_credentials SET counter = ? WHERE id = ?').run(counter, id)
  }

  /** Delete a credential */
  deleteCredential(id: string): void {
    this.db.prepare('DELETE FROM webauthn_credentials WHERE id = ?').run(id)
  }

  // -- Invite Tokens --

  /** Create an invite token */
  createInviteToken(token: string, createdBy: string, expiresAt: string): void {
    this.db.prepare(
      'INSERT INTO invite_tokens (token, created_by, expires_at) VALUES (?, ?, ?)',
    ).run(token, createdBy, expiresAt)
  }

  /** Get an invite token (only if not used and not expired) */
  getValidInviteToken(token: string): { token: string; createdBy: string; expiresAt: string } | null {
    const row = this.db.prepare(
      "SELECT token, created_by as createdBy, expires_at as expiresAt FROM invite_tokens WHERE token = ? AND used_by IS NULL AND expires_at > datetime('now')",
    ).get(token) as { token: string; createdBy: string; expiresAt: string } | undefined
    return row ?? null
  }

  /** Mark an invite token as used */
  markInviteUsed(token: string, usedBy: string): void {
    this.db.prepare('UPDATE invite_tokens SET used_by = ? WHERE token = ?').run(usedBy, token)
  }

  /** Get all active (unused, non-expired) invite tokens */
  getActiveInviteTokens(): Array<{ token: string; createdBy: string; expiresAt: string; createdAt: string }> {
    return this.db.prepare(
      "SELECT token, created_by as createdBy, expires_at as expiresAt, created_at as createdAt FROM invite_tokens WHERE used_by IS NULL AND expires_at > datetime('now') ORDER BY created_at DESC",
    ).all() as Array<{ token: string; createdBy: string; expiresAt: string; createdAt: string }>
  }

  /** Delete an invite token */
  deleteInviteToken(token: string): void {
    this.db.prepare('DELETE FROM invite_tokens WHERE token = ?').run(token)
  }

  // -- Backup --

  /** Get the backup configuration */
  getBackupConfig(): BackupConfig | null {
    const row = this.db.prepare(
      'SELECT destination, schedule_days as scheduleDays, schedule_hour as scheduleHour, schedule_minute as scheduleMinute, retention_count as retentionCount, enabled FROM backup_config WHERE id = ?',
    ).get('default') as { destination: string; scheduleDays: string; scheduleHour: number; scheduleMinute: number; retentionCount: number; enabled: number } | undefined
    if (!row) return null
    return {
      destination: row.destination,
      scheduleDays: row.scheduleDays.split(',').map(Number),
      scheduleHour: row.scheduleHour,
      scheduleMinute: row.scheduleMinute,
      retentionCount: row.retentionCount,
      enabled: row.enabled === 1,
    }
  }

  /** Save backup configuration (upsert) */
  saveBackupConfig(config: BackupConfig): void {
    const days = config.scheduleDays.join(',')
    this.db.prepare(`
      INSERT INTO backup_config (id, destination, schedule_days, schedule_hour, schedule_minute, retention_count, enabled, updated_at)
      VALUES ('default', ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        destination = ?, schedule_days = ?, schedule_hour = ?, schedule_minute = ?,
        retention_count = ?, enabled = ?, updated_at = datetime('now')
    `).run(
      config.destination, days, config.scheduleHour, config.scheduleMinute, config.retentionCount, config.enabled ? 1 : 0,
      config.destination, days, config.scheduleHour, config.scheduleMinute, config.retentionCount, config.enabled ? 1 : 0,
    )
  }

  /** Add a backup history entry */
  addBackupHistory(id: string, status: string, startedAt: string): void {
    this.db.prepare(
      'INSERT INTO backup_history (id, status, started_at) VALUES (?, ?, ?)',
    ).run(id, status, startedAt)
  }

  /** Update a backup history entry */
  updateBackupHistory(id: string, status: string, finishedAt: string, sizeBytes: number | null, errorMessage: string | null): void {
    this.db.prepare(
      'UPDATE backup_history SET status = ?, finished_at = ?, size_bytes = ?, error_message = ? WHERE id = ?',
    ).run(status, finishedAt, sizeBytes, errorMessage, id)
  }

  /** Get backup history entries, newest first */
  getBackupHistory(limit: number = 20): BackupHistoryEntry[] {
    return this.db.prepare(
      'SELECT id, status, started_at as startedAt, finished_at as finishedAt, size_bytes as sizeBytes, error_message as errorMessage FROM backup_history ORDER BY started_at DESC LIMIT ?',
    ).all(limit) as BackupHistoryEntry[]
  }

  /** Get the latest backup entry */
  getLatestBackup(): BackupHistoryEntry | null {
    const row = this.db.prepare(
      "SELECT id, status, started_at as startedAt, finished_at as finishedAt, size_bytes as sizeBytes, error_message as errorMessage FROM backup_history WHERE status != 'running' ORDER BY started_at DESC LIMIT 1",
    ).get() as BackupHistoryEntry | undefined
    return row ?? null
  }

  /** Delete old backup history entries beyond retention count */
  deleteOldBackupHistory(retentionCount: number): void {
    this.db.prepare(
      'DELETE FROM backup_history WHERE id NOT IN (SELECT id FROM backup_history ORDER BY started_at DESC LIMIT ?)',
    ).run(retentionCount)
  }

  // -- Static Sites --

  /** Get all static sites ordered by domain */
  getStaticSites(): StaticSite[] {
    const rows = this.db.prepare(
      'SELECT id, domain, enabled, created_at as createdAt, updated_at as updatedAt FROM static_sites ORDER BY domain',
    ).all() as Array<{ id: number; domain: string; enabled: number; createdAt: string; updatedAt: string }>
    return rows.map(r => ({ ...r, enabled: r.enabled === 1 }))
  }

  /** Get a single static site by ID */
  getStaticSite(id: number): StaticSite | null {
    const row = this.db.prepare(
      'SELECT id, domain, enabled, created_at as createdAt, updated_at as updatedAt FROM static_sites WHERE id = ?',
    ).get(id) as { id: number; domain: string; enabled: number; createdAt: string; updatedAt: string } | undefined
    if (!row) return null
    return { ...row, enabled: row.enabled === 1 }
  }

  /** Find a static site by domain */
  getStaticSiteByDomain(domain: string): StaticSite | null {
    const row = this.db.prepare(
      'SELECT id, domain, enabled, created_at as createdAt, updated_at as updatedAt FROM static_sites WHERE domain = ?',
    ).get(domain) as { id: number; domain: string; enabled: number; createdAt: string; updatedAt: string } | undefined
    if (!row) return null
    return { ...row, enabled: row.enabled === 1 }
  }

  /** Create a new static site entry */
  createStaticSite(domain: string): StaticSite {
    const result = this.db.prepare(
      'INSERT INTO static_sites (domain) VALUES (?)',
    ).run(domain)
    return this.getStaticSite(Number(result.lastInsertRowid))!
  }

  /** Update an existing static site */
  updateStaticSite(id: number, data: UpdateStaticSiteData): StaticSite | null {
    const current = this.getStaticSite(id)
    if (!current) return null

    const updates: string[] = []
    const values: unknown[] = []

    if (data.domain !== undefined) {
      updates.push('domain = ?')
      values.push(data.domain)
    }
    if (data.enabled !== undefined) {
      updates.push('enabled = ?')
      values.push(data.enabled ? 1 : 0)
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(id)
      this.db.prepare(
        `UPDATE static_sites SET ${updates.join(', ')} WHERE id = ?`,
      ).run(...values)
    }

    return this.getStaticSite(id)
  }

  /** Delete a static site by ID */
  deleteStaticSite(id: number): boolean {
    const result = this.db.prepare('DELETE FROM static_sites WHERE id = ?').run(id)
    return result.changes > 0
  }

  /** Create an atomic backup of the SQLite database */
  backupDatabase(destPath: string): void {
    this.db.backup(destPath)
  }
}

// Persist across HMR reloads in development
const globalForDb = globalThis as typeof globalThis & { __databaseService?: DatabaseService }
export const databaseService = globalForDb.__databaseService ??= new DatabaseService()
