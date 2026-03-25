import type { ComposeProject } from './docker'

/** A group for organizing projects */
export interface ProjectGroup {
  id: number
  name: string
  sortOrder: number
}

/** Metadata stored in the database for a project */
export interface ProjectMetadata {
  groupId: number | null
  groupName: string | null
  displayName: string | null
  role: string | null
}

/** Where a project originates from */
export type ProjectSource = 'managed' | 'external' | 'missing' | 'system'

/** A project with merged Docker/filesystem data and database metadata */
export interface ProjectWithMetadata extends ComposeProject {
  metadata: ProjectMetadata
  /** Where this project comes from */
  source: ProjectSource
}

/** Global application settings */
export interface SystemSettings {
  proxyProject: string | null
}
