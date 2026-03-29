# Labben

A self-hosted homelab management dashboard for Docker. Manage your Compose projects, containers, reverse proxy, and backups — all from one clean interface.

## Features

- **Project management** — Create, start, stop, update, and configure Docker Compose projects from a master-detail UI
- **Container overview** — Monitor status, ports, volumes, environment variables, and live logs for all your containers
- **Nginx Proxy Manager integration** — Connect to NPM's API to create and manage proxy hosts directly from your project view
- **Smart proxy suggestions** — Configurable base domain with one-click "Publish" to expose services
- **Scheduled backups** — Automatic rsync backup of all project files and data on a configurable schedule with retention management
- **Passkey authentication** — Passwordless login with WebAuthn. First user creates an account on setup, invite others via shareable links
- **Project grouping** — Organize projects into custom groups, with automatic detection of external and system projects
- **Self-aware** — Labben detects its own container and prevents accidental self-shutdown
- **Themes** — 6 color palettes (Standard, Ocean, Forest, Sunset, Neon, Contrast) with dark/light/auto modes
- **Internationalization** — English and Swedish, with more languages easy to add
- **SQLite metadata** — Persistent project metadata, groups, and settings with zero configuration

## Quick Start

### 1. Create a `.env` file

```bash
# Required: path to your Docker Compose projects
COMPOSE_PATH=/path/to/your/compose/projects
```

### 2. Download `docker-compose.yml`

```bash
curl -O https://raw.githubusercontent.com/einord/labben/main/docker-compose.yml
```

### 3. Start Labben

```bash
docker compose up -d
```

Labben is now available at `http://localhost:3005`. On first visit you'll create your account with a passkey.

## Configuration

All configuration is done via a `.env` file. Copy `.env.example` as a starting point:

```bash
# Required: path to your Docker Compose projects on the host
COMPOSE_PATH=/path/to/your/compose/projects

# Optional: backup destination (e.g. NAS mount)
# BACKUP_PATH=/mnt/nas/backups

# Optional: set when exposing Labben publicly
# AUTH_RP_ID=labben.example.com
# AUTH_ORIGIN=https://labben.example.com
# AUTH_SESSION_SECRET=replace-with-a-random-string
```

### Enabling backups

1. Add `BACKUP_PATH` to your `.env` pointing to your backup destination
2. Uncomment the backup volume line in `docker-compose.yml`
3. Restart: `docker compose up -d`
4. Go to **Settings → Backup** in Labben, set destination to `/backups`, configure schedule, and enable

### Exposing publicly

When accessing Labben via a domain (through a reverse proxy):

1. Set `AUTH_RP_ID` to your domain (e.g. `labben.example.com`)
2. Set `AUTH_ORIGIN` to the full URL (e.g. `https://labben.example.com`)
3. Set `AUTH_SESSION_SECRET` to a random string (sessions survive restarts)
4. Restart: `docker compose up -d`

> **Note:** Passkeys require HTTPS in production. `localhost` is exempted for development.

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COMPOSE_PATH` | Yes | — | Host path to your Docker Compose projects |
| `BACKUP_PATH` | No | — | Host path for backup destination |
| `AUTH_RP_ID` | No | `localhost` | Your domain (for passkey authentication) |
| `AUTH_ORIGIN` | No | `http://localhost:3005` | Full URL users access Labben from |
| `AUTH_SESSION_SECRET` | No | Auto-generated | Stable secret for session cookies |

## Development

```bash
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:3005`. Create a `.env` file for local settings (see `.env.example`).

## Tech stack

- **Frontend:** Nuxt 3, Vue 3, TypeScript
- **Backend:** Nitro server routes
- **Auth:** WebAuthn passkeys via SimpleWebAuthn
- **Database:** SQLite (better-sqlite3)
- **Docker:** Dockerode for container management
- **Backup:** rsync with scheduled automation
- **Package manager:** pnpm

## License

MIT
