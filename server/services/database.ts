import Database from 'better-sqlite3'
import { resolve } from 'node:path'
import type { ProjectGroup, ProjectMetadata } from '~/types/project'

class DatabaseService {
  private db: Database.Database

  constructor() {
    const dbPath = resolve(process.env.DATA_DIR || 'data', 'labben.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.createTables()
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
}

// Persist across HMR reloads in development
const globalForDb = globalThis as typeof globalThis & { __databaseService?: DatabaseService }
export const databaseService = globalForDb.__databaseService ??= new DatabaseService()
