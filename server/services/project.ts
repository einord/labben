import type { ProjectWithMetadata, ProjectMetadata, ProjectSource } from '~/types/project'
import { resolve } from 'node:path'
import { dockerService } from './docker'
import { databaseService } from './database'

const NPM_IMAGE_PREFIX = 'jc21/nginx-proxy-manager'

const NPM_COMPOSE_TEMPLATE = `services:
  app:
    image: jc21/nginx-proxy-manager:latest
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    restart: unless-stopped
    networks:
      - proxy

networks:
  proxy:
    name: proxy
`

const DEFAULT_METADATA: ProjectMetadata = {
  groupId: null,
  groupName: null,
  displayName: null,
  role: null,
}

class ProjectService {
  private composeDir: string
  private selfHostname: string | null

  constructor() {
    this.composeDir = resolve(process.env.COMPOSE_DIR || '/compose-files')
    // Docker sets HOSTNAME to the container ID
    this.selfHostname = process.env.HOSTNAME ?? null
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
      const isSelf = this.isOwnProject(project.containers)

      // Auto-assign system role if this is Labben itself
      const effectiveRole = isSelf ? 'labben' : metadata.role
      const source = effectiveRole ? 'system' : this.resolveSource(project.workingDir, project.configPath)

      result.push({ ...project, metadata: { ...metadata, role: effectiveRole }, source, isSelf })
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
        isSelf: false,
      })
    }

    return result
  }

  /** Check if any container in the project is the Labben app itself */
  private isOwnProject(containers: Array<{ id: string }>): boolean {
    if (!this.selfHostname) return false
    return containers.some(c => c.id.startsWith(this.selfHostname!))
  }

  /** Determine if a project is managed (in COMPOSE_DIR) or external. */
  private resolveSource(workingDir: string, configFile?: string): ProjectSource {
    // Check if either workingDir or configFile is under COMPOSE_DIR
    // This handles the case where Docker labels have host paths but
    // the filesystem scanner has updated configFile to container paths
    const paths = [workingDir, configFile].filter(Boolean) as string[]
    for (const p of paths) {
      const resolved = resolve(p)
      if (resolved.startsWith(this.composeDir)) return 'managed'
    }
    return paths.length === 0 ? 'external' : 'external'
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

  /** Check if a project uses the Nginx Proxy Manager image */
  isNpmCompatible(project: ProjectWithMetadata): boolean {
    return project.containers.some(c => c.image.startsWith(NPM_IMAGE_PREFIX))
  }

  /** Get all projects that could serve as an NPM proxy */
  async getNpmCandidates(): Promise<ProjectWithMetadata[]> {
    const projects = await this.listProjects()
    return projects.filter(p => this.isNpmCompatible(p) && p.source !== 'missing')
  }

  /** Get the currently configured proxy project name */
  getProxyProject(): string | null {
    return databaseService.getSetting('proxy_project')
  }

  /** Set a project as the system proxy */
  setProxyProject(name: string): void {
    // Clear any existing proxy role
    databaseService.clearRole('proxy')
    // Set the new proxy role and setting
    databaseService.upsertProjectMetadata(name, { role: 'proxy' })
    databaseService.setSetting('proxy_project', name)
  }

  /** Remove the proxy designation */
  clearProxyProject(): void {
    databaseService.clearRole('proxy')
    databaseService.deleteSetting('proxy_project')
  }

  /** Create a new NPM project with the default template and set it as proxy */
  async createNpmProject(name: string): Promise<{ name: string; configPath: string }> {
    const result = await this.createProject(name, NPM_COMPOSE_TEMPLATE)
    this.setProxyProject(result.name)
    return result
  }

  /** Remove all metadata for a project from the database. */
  removeProject(projectName: string): void {
    databaseService.deleteProjectMetadata(projectName)
  }
}

// Persist across HMR reloads in development
const globalForProject = globalThis as typeof globalThis & { __projectService?: ProjectService }
export const projectService = globalForProject.__projectService ??= new ProjectService()
