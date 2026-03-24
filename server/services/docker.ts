import Docker from 'dockerode'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
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

function toContainerStatus(state: string): ContainerStatus {
  if (VALID_STATUSES.has(state)) {
    return state as ContainerStatus
  }
  return 'dead'
}

class DockerService {
  private _docker: Docker | null = null
  private newProjectDir: string

  constructor() {
    this.newProjectDir = process.env.COMPOSE_DIR || '/compose-files'
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
      statusText: info.State.Status,
      ports,
      project: info.Config.Labels['com.docker.compose.project'] || undefined,
      createdAt: info.Created,
      env: info.Config.Env ?? [],
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

  /** List compose projects by grouping containers and reading paths from Docker labels. */
  async listProjects(): Promise<ComposeProject[]> {
    const containers = await this.listContainers()
    const projectMap = new Map<string, { containers: ContainerSummary[]; workingDir: string; configFile: string }>()

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
        })
      }
    }

    const projects: ComposeProject[] = []
    for (const [name, data] of projectMap) {
      const runningCount = data.containers.filter((c) => c.status === 'running').length
      const configPath = data.configFile || join(data.workingDir, 'docker-compose.yml')
      projects.push({
        name,
        configPath,
        workingDir: data.workingDir,
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

  // -- Private helpers --

  /** Find a project by name from running containers. */
  private async findProject(name: string): Promise<ComposeProject> {
    const projects = await this.listProjects()
    const project = projects.find((p) => p.name === name)
    if (!project) {
      throw new Error(`Project not found: ${name}`)
    }
    return project
  }

  /** Run a docker compose command using the real project working directory. */
  private async runComposeCommand(name: string, ...args: string[]): Promise<string> {
    const project = await this.findProject(name)
    const { stdout, stderr } = await execFileAsync(
      'docker',
      ['compose', '-f', project.configPath, ...args],
      { timeout: 120_000, cwd: project.workingDir || undefined },
    )
    return stdout + stderr
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
