import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve, join } from 'node:path'
import { mkdir, writeFile, readFile, access, rename, rm } from 'node:fs/promises'
import Docker from 'dockerode'
import { databaseService } from './database'
import { parseCompose } from '../utils/compose'
import type { StaticSite, StaticSitesStatus, UpdateStaticSiteData } from '~/types/static-sites'

const execFileAsync = promisify(execFile)

const CONTAINER_NAME = 'static-sites'
const PROJECT_DIR_NAME = 'static-sites'

const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
</head>
<body>
    <h1>It works!</h1>
    <p>Replace this file with your own content.</p>
</body>
</html>
`

class StaticSitesService {
  private composeBaseDir: string
  private hostComposeDir: string | null

  constructor() {
    this.composeBaseDir = resolve(process.env.COMPOSE_DIR || process.env.COMPOSE_PATH || '/data/compose')
    this.hostComposeDir = process.env.COMPOSE_HOST_DIR || null
  }

  /** Get the container-local path for the static-sites compose project */
  private get projectDir(): string {
    return join(this.composeBaseDir, PROJECT_DIR_NAME)
  }

  /** Get the sites directory where website files are stored */
  private get sitesDir(): string {
    return join(this.projectDir, 'sites')
  }

  /** Get the path to the nginx.conf file */
  private get nginxConfPath(): string {
    return join(this.projectDir, 'nginx.conf')
  }

  /** Get the path to the docker-compose.yml file */
  private get composeFilePath(): string {
    return join(this.projectDir, 'docker-compose.yml')
  }

  /** Resolve a compose file path to use host paths when running in a container */
  private resolveHostPath(containerPath: string): string {
    if (!this.hostComposeDir) return containerPath
    if (!containerPath.startsWith(this.composeBaseDir)) return containerPath
    return containerPath.replace(this.composeBaseDir, this.hostComposeDir)
  }

  /** Get the status of the managed nginx container and site count */
  async getStatus(): Promise<StaticSitesStatus> {
    const siteCount = databaseService.getStaticSites().length
    let containerRunning = false
    let managedContainerExists = false

    try {
      const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' })
      const containers = await docker.listContainers({ all: true })
      const container = containers.find(c =>
        (c.Names[0] ?? '').replace(/^\//, '') === CONTAINER_NAME,
      )
      if (container) {
        managedContainerExists = true
        containerRunning = container.State === 'running'
      }
    } catch {
      // Docker not available or container doesn't exist
    }

    return { containerRunning, siteCount, managedContainerExists }
  }

  /** Get all static sites from the database */
  getSites(): StaticSite[] {
    return databaseService.getStaticSites()
  }

  /** Get a single static site by ID */
  getSite(id: number): StaticSite | null {
    return databaseService.getStaticSite(id)
  }

  /** Create a new static site with default content */
  async createSite(domain: string): Promise<StaticSite> {
    this.validateDomain(domain)

    const existing = databaseService.getStaticSiteByDomain(domain)
    if (existing) {
      throw new Error(`Site already exists for domain: ${domain}`)
    }

    const site = databaseService.createStaticSite(domain)

    // Create the site directory with default index.html
    const siteDir = join(this.sitesDir, domain)
    await mkdir(siteDir, { recursive: true })
    await writeFile(join(siteDir, 'index.html'), DEFAULT_INDEX_HTML, 'utf-8')

    // Regenerate nginx config and reload if running
    await this.writeNginxConfig()
    await this.reloadNginx()

    return site
  }

  /** Update an existing static site */
  async updateSite(id: number, data: UpdateStaticSiteData): Promise<StaticSite | null> {
    const current = databaseService.getStaticSite(id)
    if (!current) return null

    if (data.domain !== undefined) {
      this.validateDomain(data.domain)

      // Check for duplicate domain (excluding current site)
      const existingByDomain = databaseService.getStaticSiteByDomain(data.domain)
      if (existingByDomain && existingByDomain.id !== id) {
        throw new Error(`Site already exists for domain: ${data.domain}`)
      }
    }

    const updated = databaseService.updateStaticSite(id, data)
    if (!updated) return null

    // If domain changed, rename the site directory
    if (data.domain !== undefined && data.domain !== current.domain) {
      const oldDir = join(this.sitesDir, current.domain)
      const newDir = join(this.sitesDir, data.domain)
      try {
        await access(oldDir)
        await rename(oldDir, newDir)
      } catch {
        // Old directory might not exist — create new one instead
        await mkdir(newDir, { recursive: true })
        await writeFile(join(newDir, 'index.html'), DEFAULT_INDEX_HTML, 'utf-8')
      }
    }

    // Regenerate nginx config and reload
    await this.writeNginxConfig()
    await this.reloadNginx()

    return updated
  }

  /** Delete a static site and its files */
  async deleteSite(id: number): Promise<boolean> {
    const site = databaseService.getStaticSite(id)
    if (!site) return false

    const deleted = databaseService.deleteStaticSite(id)
    if (!deleted) return false

    // Remove the site directory
    const siteDir = join(this.sitesDir, site.domain)
    try {
      await rm(siteDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist
    }

    // Regenerate nginx config and reload
    await this.writeNginxConfig()
    await this.reloadNginx()

    return true
  }

  /** Get the filesystem path for a site's files directory */
  getSitePath(id: number): string | null {
    const site = databaseService.getStaticSite(id)
    if (!site) return null
    return join(this.sitesDir, site.domain)
  }

  /** Extract an uploaded archive into a site's directory */
  async uploadSiteArchive(id: number, file: Buffer, filename: string): Promise<void> {
    const site = databaseService.getStaticSite(id)
    if (!site) throw new Error('Site not found')

    const siteDir = join(this.sitesDir, site.domain)
    await mkdir(siteDir, { recursive: true })

    const lowerFilename = filename.toLowerCase()

    if (lowerFilename.endsWith('.tar.gz') || lowerFilename.endsWith('.tgz')) {
      // Write temp file and extract with tar
      const tmpFile = join(siteDir, '.upload.tar.gz')
      await writeFile(tmpFile, file)
      try {
        await execFileAsync('tar', ['-xzf', tmpFile, '-C', siteDir], { timeout: 60_000 })
      } finally {
        await rm(tmpFile, { force: true })
      }
    } else if (lowerFilename.endsWith('.zip')) {
      // Write temp file and extract with unzip
      const tmpFile = join(siteDir, '.upload.zip')
      await writeFile(tmpFile, file)
      try {
        await execFileAsync('unzip', ['-o', tmpFile, '-d', siteDir], { timeout: 60_000 })
      } finally {
        await rm(tmpFile, { force: true })
      }
    } else {
      throw new Error('Unsupported archive format. Use .zip, .tar.gz, or .tgz')
    }
  }

  /** Detect the network name used by the configured NPM proxy project */
  private async detectProxyNetwork(): Promise<string | null> {
    const proxyProject = databaseService.getSetting('proxy_project')
    if (!proxyProject) return null

    try {
      const configPath = join(this.composeBaseDir, proxyProject, 'docker-compose.yml')
      const content = await readFile(configPath, 'utf-8')
      const compose = parseCompose(content)

      if (!compose.networks) return null

      // Look for a network with an explicit name, or use the first network key
      for (const [key, config] of Object.entries(compose.networks)) {
        const netConfig = config as Record<string, unknown> | null
        if (netConfig && typeof netConfig.name === 'string') {
          return netConfig.name
        }
        return `${proxyProject}_${key}`
      }
    } catch {
      // Compose file not found or unreadable
    }

    return null
  }

  /** Ensure the compose project directory and files exist */
  async ensureComposeProject(): Promise<void> {
    await mkdir(this.projectDir, { recursive: true })
    await mkdir(this.sitesDir, { recursive: true })

    // Always regenerate compose file to keep network config in sync
    const networkName = await this.detectProxyNetwork()

    let composeContent = `services:
  static-sites:
    image: nginx:alpine
    container_name: static-sites
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./sites:/var/www/sites:ro
`

    if (networkName) {
      composeContent += `    networks:
      - proxy_net

networks:
  proxy_net:
    name: ${networkName}
    external: true
`
    }

    await writeFile(this.composeFilePath, composeContent, 'utf-8')

    // Always ensure nginx.conf exists
    try {
      await access(this.nginxConfPath)
    } catch {
      await this.writeNginxConfig()
    }
  }

  /** Check if a domain string is safe for use in nginx config (defense-in-depth) */
  private isSafeDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    return domainRegex.test(domain)
  }

  /** Generate the nginx.conf content from all enabled sites */
  generateNginxConfig(): string {
    const sites = databaseService.getStaticSites().filter(s => s.enabled && this.isSafeDomain(s.domain))

    const serverBlocks = sites.map(site => `
    server {
        listen 80;
        server_name ${site.domain};

        root /var/www/sites/${site.domain};
        index index.html index.htm;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }`)

    return `worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
${serverBlocks.join('\n')}

    # Catch-all: reject requests for unknown hosts
    server {
        listen 80 default_server;
        server_name _;
        return 444;
    }
}
`
  }

  /** Write the generated nginx config to disk */
  async writeNginxConfig(): Promise<void> {
    await mkdir(this.projectDir, { recursive: true })
    const config = this.generateNginxConfig()
    await writeFile(this.nginxConfPath, config, 'utf-8')
  }

  /** Reload nginx inside the running container, or do nothing if not running */
  async reloadNginx(): Promise<void> {
    try {
      const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' })
      const container = docker.getContainer(CONTAINER_NAME)
      // Verify container exists and is running
      const info = await container.inspect()
      if (info.State.Status !== 'running') return

      const exec = await container.exec({
        Cmd: ['nginx', '-s', 'reload'],
        AttachStdout: true,
        AttachStderr: true,
      })
      await exec.start({})
    } catch {
      // Container not running or doesn't exist — skip reload
    }
  }

  /** Start the static-sites container via docker compose */
  async startContainer(): Promise<void> {
    await this.ensureComposeProject()
    await this.writeNginxConfig()

    const configPath = this.resolveHostPath(this.composeFilePath)
    await execFileAsync('docker', ['compose', '-f', configPath, 'up', '-d'], { timeout: 120_000 })
  }

  /** Stop the static-sites container via docker compose */
  async stopContainer(): Promise<void> {
    const configPath = this.resolveHostPath(this.composeFilePath)
    try {
      await execFileAsync('docker', ['compose', '-f', configPath, 'down'], { timeout: 120_000 })
    } catch {
      // Compose project may not exist yet
    }
  }

  /** Validate that a domain string has a valid format */
  private validateDomain(domain: string): void {
    if (!domain || !domain.trim()) {
      throw new Error('Domain is required')
    }
    if (!this.isSafeDomain(domain)) {
      throw new Error(`Invalid domain format: ${domain}`)
    }
  }
}

// Persist across HMR reloads in development
const globalForStaticSites = globalThis as typeof globalThis & { __staticSitesService?: StaticSitesService }
export const staticSitesService = globalForStaticSites.__staticSitesService ??= new StaticSitesService()
