import Docker from 'dockerode'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, mkdir, access, readdir, stat, symlink, lstat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { composePath, composeHostDir } from '../utils/config'
import { validateComposeYaml, parseCompose } from '../utils/compose'
import type { Readable } from 'node:stream'
import type {
  ContainerSummary,
  ContainerDetail,
  ContainerPort,
  ContainerVolume,
  ContainerStatus,
  ComposeProject,
} from '~/types/docker'

const execFileAsync = promisify(execFile)

const VALID_STATUSES: ReadonlySet<string> = new Set<ContainerStatus>([
  'running', 'exited', 'paused', 'restarting', 'created', 'removing', 'dead',
])

import { maskSensitiveEnvVars } from '../utils/env-mask'

function toContainerStatus(state: string): ContainerStatus {
  if (VALID_STATUSES.has(state)) {
    return state as ContainerStatus
  }
  return 'dead'
}

class DockerService {
  private _docker: Docker | null = null
  private newProjectDir: string
  private hostComposeDir: string | null
  private symlinkError: string | null = null

  constructor() {
    this.newProjectDir = composePath
    this.hostComposeDir = composeHostDir

    // Validate COMPOSE_HOST_DIR accessibility at startup
    if (this.hostComposeDir) {
      access(this.hostComposeDir).catch(() => {
        console.warn(`[docker] WARNING: COMPOSE_HOST_DIR="${this.hostComposeDir}" is not accessible. Compose commands will likely fail. Verify the path exists on the host and is correctly mapped.`)
      })
    }

    // Create a symlink so the host path is accessible inside the container
    this.ensureHostPathSymlink().catch((err) => {
      this.symlinkError = err instanceof Error ? err.message : String(err)
      console.error(`[docker] Failed to create host path symlink: ${this.symlinkError}`)
    })
  }

  /** Create a symlink from host path to container path so compose CLI can read files via host paths. */
  private async ensureHostPathSymlink(): Promise<void> {
    if (!this.hostComposeDir || this.hostComposeDir === this.newProjectDir) return
    try {
      await access(this.hostComposeDir)
      // Already exists (or is already a symlink)
    } catch {
      // Create parent directories and symlink
      const parentDir = resolve(this.hostComposeDir, '..')
      await mkdir(parentDir, { recursive: true })
      await symlink(this.newProjectDir, this.hostComposeDir)
    }
  }

  /** Check whether the host path symlink is healthy via live filesystem checks. */
  async checkSymlinkHealth(): Promise<{ needed: boolean; ok: boolean; error: string | null }> {
    if (!this.hostComposeDir || this.hostComposeDir === this.newProjectDir) {
      return { needed: false, ok: true, error: null }
    }
    try {
      const stats = await lstat(this.hostComposeDir)
      if (!stats.isSymbolicLink()) {
        return { needed: true, ok: false, error: `Path exists but is not a symlink: ${this.hostComposeDir}` }
      }
      // Verify the symlink target is accessible
      await access(this.hostComposeDir)
      return { needed: true, ok: true, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Fall back to startup error if the path doesn't exist yet
      return { needed: true, ok: false, error: this.symlinkError || message }
    }
  }

  /** Lazy-initialize Docker connection to avoid HMR issues */
  private get docker(): Docker {
    if (!this._docker) {
      const socketPath = process.env.DOCKER_SOCKET || '/var/run/docker.sock'
      this._docker = new Docker({ socketPath })
    }
    return this._docker
  }

  /** List all containers (including stopped), mapped to ContainerSummary. */
  async listContainers(): Promise<ContainerSummary[]> {
    const containers = await this.docker.listContainers({ all: true })

    return containers.map((c): ContainerSummary => ({
      id: c.Id,
      name: (c.Names[0] ?? '').replace(/^\//, ''),
      image: c.Image,
      status: toContainerStatus(c.State),
      state: c.State,
      statusText: c.Status,
      ports: this.mapPorts(c.Ports),
      project: c.Labels['com.docker.compose.project'] || undefined,
      projectWorkingDir: c.Labels['com.docker.compose.project.working_dir'] || undefined,
      projectConfigFile: c.Labels['com.docker.compose.project.config_files'] || undefined,
      createdAt: new Date(c.Created * 1000).toISOString(),
    }))
  }

  /** Get detailed information about a single container. */
  async getContainer(id: string): Promise<ContainerDetail> {
    const container = this.docker.getContainer(id)
    const info = await container.inspect()

    const ports = this.mapPortsFromInspect(info.NetworkSettings.Ports)
    const volumes: ContainerVolume[] = (info.Mounts ?? []).map((m) => ({
      source: m.Source ?? '',
      destination: m.Destination,
      mode: m.Mode ?? 'rw',
    }))
    const networks = Object.keys(info.NetworkSettings.Networks ?? {})

    return {
      id: info.Id,
      name: info.Name.replace(/^\//, ''),
      image: info.Config.Image,
      status: toContainerStatus(info.State.Status),
      state: info.State.Status,
      statusText: this.buildStatusText(info.State),
      ports,
      project: info.Config.Labels['com.docker.compose.project'] || undefined,
      createdAt: info.Created,
      env: maskSensitiveEnvVars(info.Config.Env ?? []),
      volumes,
      networks,
      restartPolicy: info.HostConfig.RestartPolicy?.Name ?? 'no',
      command: (info.Config.Cmd ?? []).join(' '),
    }
  }

  /** Start a container by id. */
  async startContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id)
    await container.start()
  }

  /** Stop a container by id. */
  async stopContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id)
    await container.stop()
  }

  /** Restart a container by id. */
  async restartContainer(id: string): Promise<void> {
    const container = this.docker.getContainer(id)
    await container.restart()
  }

  /** Get the last N lines of logs from a container. */
  async getContainerLogs(id: string, tail: number = 100): Promise<string> {
    const container = this.docker.getContainer(id)
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    })

    // Dockerode returns a Buffer or string; strip Docker stream headers (8 bytes per frame)
    return this.demuxLogs(logs)
  }

  /** Stream live logs from a container. */
  async streamContainerLogs(id: string): Promise<Readable> {
    const container = this.docker.getContainer(id)
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 50,
      timestamps: true,
    })

    return stream as unknown as Readable
  }

  /** List compose projects from both Docker containers and the filesystem. */
  async listProjects(): Promise<ComposeProject[]> {
    const containers = await this.listContainers()
    const projectMap = new Map<string, {
      containers: ContainerSummary[]
      workingDir: string
      configFile: string
      hostWorkingDir: string
      hostConfigFile: string
    }>()

    // Group running containers by compose project
    // Docker labels contain host-side paths
    for (const container of containers) {
      if (!container.project) continue
      const existing = projectMap.get(container.project)
      if (existing) {
        existing.containers.push(container)
      } else {
        projectMap.set(container.project, {
          containers: [container],
          workingDir: container.projectWorkingDir ?? '',
          configFile: container.projectConfigFile ?? '',
          hostWorkingDir: container.projectWorkingDir ?? '',
          hostConfigFile: container.projectConfigFile ?? '',
        })
      }
    }

    // Scan the compose directory for projects not yet in Docker
    await this.addFilesystemProjects(projectMap)

    const projects: ComposeProject[] = []
    for (const [name, data] of projectMap) {
      const runningCount = data.containers.filter((c) => c.status === 'running').length
      const configPath = data.configFile || join(data.workingDir, 'docker-compose.yml')
      const hostConfigPath = data.hostConfigFile || join(data.hostWorkingDir, 'docker-compose.yml')
      projects.push({
        name,
        configPath,
        workingDir: data.workingDir,
        hostConfigPath,
        hostWorkingDir: data.hostWorkingDir,
        containers: data.containers,
        runningCount,
        totalCount: data.containers.length,
      })
    }

    return projects
  }

  /** Read the docker-compose.yml content for a project. */
  async getProjectConfig(name: string): Promise<string> {
    const project = await this.findProject(name)
    return await readFile(project.configPath, 'utf-8')
  }

  /** Save docker-compose.yml content for a project. */
  async saveProjectConfig(name: string, content: string): Promise<void> {
    validateComposeYaml(content)
    const project = await this.findProject(name)
    await writeFile(project.configPath, content, 'utf-8')
  }

  /** Run `docker compose up -d` for a project. */
  async projectUp(name: string): Promise<string> {
    return this.runComposeCommand(name, 'up', '-d')
  }

  /** Run `docker compose down` for a project. */
  async projectDown(name: string): Promise<string> {
    return this.runComposeCommand(name, 'down')
  }

  /** Run `docker compose pull` for a project. */
  async projectPull(name: string): Promise<string> {
    return this.runComposeCommand(name, 'pull')
  }

  /** Update a project: pull + down + up in one operation (avoids findProject after down removes containers). */
  async projectUpdate(name: string): Promise<string> {
    const project = await this.findProject(name)
    const configPath = this.resolveComposePath(project.configPath)
    const run = (args: string[]) =>
      execFileAsync('docker', ['compose', '-f', configPath, ...args], { timeout: 120_000 })
        .then(({ stdout, stderr }) => stdout + stderr)

    const pullOutput = await run(['pull'])
    const downOutput = await run(['down'])
    const upOutput = await run(['up', '-d'])
    return pullOutput + downOutput + upOutput
  }

  /** Create a new compose project directory and write the docker-compose.yml file. */
  async createProject(name: string, content: string): Promise<{ name: string; configPath: string }> {
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '')
    const projectDir = join(this.newProjectDir, safeName)
    const configPath = join(projectDir, 'docker-compose.yml')

    // Ensure the directory does not already exist
    try {
      await access(projectDir)
      throw new Error(`Project directory already exists: ${safeName}`)
    } catch (err: unknown) {
      // access throws if path doesn't exist — that's what we want
      if (err instanceof Error && err.message.includes('already exists')) {
        throw err
      }
    }

    validateComposeYaml(content)
    await mkdir(projectDir, { recursive: true })
    await writeFile(configPath, content, 'utf-8')

    return { name: safeName, configPath }
  }

  // -- Private helpers --

  /** Find a project by name from all known projects (Docker + filesystem). */
  private async findProject(name: string): Promise<ComposeProject> {
    const projects = await this.listProjects()
    const project = projects.find((p) => p.name === name)
    if (!project) {
      throw new Error(`Project not found: ${name}`)
    }
    return project
  }

  /** Scan the compose directory and add any projects not already known from Docker. */
  private async addFilesystemProjects(
    projectMap: Map<string, { containers: ContainerSummary[]; workingDir: string; configFile: string; hostWorkingDir: string; hostConfigFile: string }>,
  ): Promise<void> {
    try {
      const entries = await readdir(this.newProjectDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue

        const projectDir = join(this.newProjectDir, entry.name)
        const configPath = join(projectDir, 'docker-compose.yml')

        // Only include directories that contain a docker-compose.yml
        try {
          await access(configPath)
        } catch {
          continue
        }

        // Determine the effective project name: explicit name in compose file,
        // or the directory name lowercased (Docker Compose default behavior)
        const effectiveName = await this.resolveProjectName(configPath, entry.name)

        // Check if this project already exists in Docker (from container labels)
        if (projectMap.has(effectiveName)) {
          // Update container-local paths for file reading, keep host paths for compose commands
          const existing = projectMap.get(effectiveName)!
          existing.workingDir = projectDir
          existing.configFile = configPath
          continue
        }

        // Also check case-insensitive match (e.g. "Stina" dir → "stina" in Docker)
        const caseMatch = [...projectMap.keys()].find(k => k.toLowerCase() === effectiveName.toLowerCase())
        if (caseMatch) {
          const existing = projectMap.get(caseMatch)!
          existing.workingDir = projectDir
          existing.configFile = configPath
          continue
        }

        // New filesystem-only project — container and host paths are the same
        projectMap.set(effectiveName, {
          containers: [],
          workingDir: projectDir,
          configFile: configPath,
          hostWorkingDir: projectDir,
          hostConfigFile: configPath,
        })
      }
    } catch {
      // Compose directory may not exist yet — that's fine
    }
  }

  /** Resolve the effective project name from a compose file or directory name. */
  private async resolveProjectName(configPath: string, dirName: string): Promise<string> {
    try {
      const content = await readFile(configPath, 'utf-8')
      const compose = parseCompose(content)
      if (typeof compose.name === 'string' && compose.name.trim()) {
        return compose.name.trim()
      }
    } catch {
      // If we can't parse the file, fall back to directory name
    }
    // Docker Compose lowercases the directory name by default
    return dirName.toLowerCase()
  }

  /** Run a docker compose command using host-side paths (symlinked inside container). */
  private async runComposeCommand(name: string, ...args: string[]): Promise<string> {
    const project = await this.findProject(name)
    const configPath = this.resolveComposePath(project.configPath)
    const { stdout, stderr } = await execFileAsync(
      'docker',
      ['compose', '-f', configPath, ...args],
      { timeout: 120_000 },
    )
    return stdout + stderr
  }

  /** Resolve a compose file path — use host path if available (symlinked in container). */
  private resolveComposePath(containerPath: string): string {
    if (!this.hostComposeDir) return containerPath
    if (!containerPath.startsWith(this.newProjectDir)) return containerPath
    return containerPath.replace(this.newProjectDir, this.hostComposeDir)
  }

  private mapPorts(ports: Docker.Port[] | null): ContainerPort[] {
    return (ports ?? []).map((p) => ({
      private: p.PrivatePort,
      public: p.PublicPort || undefined,
      type: p.Type,
    }))
  }

  private mapPortsFromInspect(
    portBindings: Record<string, Array<{ HostIp: string; HostPort: string }> | null>,
  ): ContainerPort[] {
    const ports: ContainerPort[] = []
    for (const [key, bindings] of Object.entries(portBindings ?? {})) {
      const [portStr, protocol] = key.split('/')
      const privatePort = parseInt(portStr ?? '0', 10)

      if (bindings && bindings.length > 0) {
        for (const binding of bindings) {
          ports.push({
            private: privatePort,
            public: binding.HostPort ? parseInt(binding.HostPort, 10) : undefined,
            type: protocol ?? 'tcp',
          })
        }
      } else {
        ports.push({
          private: privatePort,
          public: undefined,
          type: protocol ?? 'tcp',
        })
      }
    }
    return ports
  }

  /** Build a human-readable status text from container state (similar to Docker CLI output). */
  private buildStatusText(state: { Status: string; StartedAt?: string; FinishedAt?: string }): string {
    const status = state.Status
    if (status === 'running' && state.StartedAt) {
      const started = new Date(state.StartedAt)
      const now = new Date()
      const diffMs = now.getTime() - started.getTime()
      return `Up ${this.formatDuration(diffMs)}`
    }
    if ((status === 'exited' || status === 'dead') && state.FinishedAt) {
      const finished = new Date(state.FinishedAt)
      const now = new Date()
      const diffMs = now.getTime() - finished.getTime()
      return `Exited ${this.formatDuration(diffMs)} ago`
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  /** Format a duration in milliseconds to a human-readable string. */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours`
    const days = Math.floor(hours / 24)
    return `${days} days`
  }

  private demuxLogs(buffer: Buffer | string): string {
    if (typeof buffer === 'string') return buffer

    const lines: string[] = []
    let offset = 0

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break
      const size = buffer.readUInt32BE(offset + 4)
      offset += 8
      if (offset + size > buffer.length) break
      lines.push(buffer.subarray(offset, offset + size).toString('utf-8'))
      offset += size
    }

    return lines.join('')
  }
}

// Persist across HMR reloads in development
const globalForDocker = globalThis as typeof globalThis & { __dockerService?: DockerService }
export const dockerService = globalForDocker.__dockerService ??= new DockerService()
