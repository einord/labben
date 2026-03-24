/** Status of a Docker container */
export type ContainerStatus = 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'removing' | 'dead'

/** Badge variant mapping for container status */
export type StatusVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

/** Port mapping for a container */
export interface ContainerPort {
  /** Private (internal) port */
  private: number
  /** Public (host) port, if mapped */
  public?: number
  /** Protocol (tcp/udp) */
  type: string
}

/** Summary of a Docker container for list views */
export interface ContainerSummary {
  id: string
  name: string
  image: string
  status: ContainerStatus
  state: string
  /** Human-readable status string (e.g. "Up 2 hours") */
  statusText: string
  ports: ContainerPort[]
  /** Docker Compose project name, if applicable */
  project?: string
  /** Working directory of the compose project (from Docker label) */
  projectWorkingDir?: string
  /** Config file path of the compose project (from Docker label) */
  projectConfigFile?: string
  /** When the container was created */
  createdAt: string
}

/** Detailed information about a single container */
export interface ContainerDetail extends ContainerSummary {
  /** Environment variables */
  env: string[]
  /** Volume mounts */
  volumes: ContainerVolume[]
  /** Network names */
  networks: string[]
  /** Restart policy */
  restartPolicy: string
  /** Command being run */
  command: string
}

/** Volume mount for a container */
export interface ContainerVolume {
  source: string
  destination: string
  mode: string
}

/** A Docker Compose project (group of related containers) */
export interface ComposeProject {
  name: string
  /** Full path to the docker-compose.yml file (from Docker labels) */
  configPath: string
  /** Working directory for compose commands */
  workingDir: string
  /** Containers belonging to this project */
  containers: ContainerSummary[]
  /** Number of running containers */
  runningCount: number
  /** Total number of containers */
  totalCount: number
}

/** Request body for creating/updating a compose project */
export interface ComposeProjectWrite {
  name: string
  /** Raw docker-compose.yml content */
  content: string
}

/** Log entry from a container */
export interface ContainerLogEntry {
  timestamp: string
  message: string
  stream: 'stdout' | 'stderr'
}

/** Generic API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
