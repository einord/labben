import type { ProjectWithMetadata, ProjectMetadata, ProjectSource } from '~/types/project'
import { resolve } from 'node:path'
import { dockerService } from './docker'
import { databaseService } from './database'

const DEFAULT_METADATA: ProjectMetadata = {
  groupId: null,
  groupName: null,
  displayName: null,
}

class ProjectService {
  private composeDir: string

  constructor() {
    this.composeDir = resolve(process.env.COMPOSE_DIR || '/compose-files')
  }

  /** List all projects by merging Docker/filesystem data with database metadata. */
  async listProjects(): Promise<ProjectWithMetadata[]> {
    const dockerProjects = await dockerService.listProjects()
    const metadataMap = databaseService.getAllProjectMetadata()

    const result: ProjectWithMetadata[] = []
    const seenNames = new Set<string>()

    // Attach metadata to each Docker/filesystem project
    for (const project of dockerProjects) {
      seenNames.add(project.name)
      const metadata = metadataMap.get(project.name) ?? DEFAULT_METADATA
      const source = this.resolveSource(project.workingDir)
      result.push({ ...project, metadata, source })
    }

    // Add DB-only projects as "missing" (exist in DB but not on disk/Docker)
    for (const [name, metadata] of metadataMap) {
      if (seenNames.has(name)) continue
      result.push({
        name,
        configPath: '',
        workingDir: '',
        containers: [],
        runningCount: 0,
        totalCount: 0,
        metadata,
        source: 'missing',
      })
    }

    return result
  }

  /** Determine if a project is managed (in COMPOSE_DIR) or external. */
  private resolveSource(workingDir: string): ProjectSource {
    if (!workingDir) return 'external'
    const resolved = resolve(workingDir)
    return resolved.startsWith(this.composeDir) ? 'managed' : 'external'
  }

  /** Create a new project (filesystem + database entry). */
  async createProject(name: string, content: string): Promise<{ name: string; configPath: string }> {
    const result = await dockerService.createProject(name, content)
    databaseService.upsertProjectMetadata(result.name, {})
    return result
  }

  /** Assign a project to a group (or remove from group with null). */
  assignGroup(projectName: string, groupId: number | null): void {
    databaseService.upsertProjectMetadata(projectName, { groupId })
  }

  /** Update the display name for a project. */
  updateDisplayName(projectName: string, displayName: string | null): void {
    databaseService.upsertProjectMetadata(projectName, { displayName })
  }

  /** Remove all metadata for a project from the database. */
  removeProject(projectName: string): void {
    databaseService.deleteProjectMetadata(projectName)
  }
}

// Persist across HMR reloads in development
const globalForProject = globalThis as typeof globalThis & { __projectService?: ProjectService }
export const projectService = globalForProject.__projectService ??= new ProjectService()
