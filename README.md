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

## Installation

### Docker Compose (recommended)

Create a `docker-compose.yml`:

```yaml
services:
  labben:
    image: ghcr.io/einord/labben:latest
    ports:
      - "3005:3005"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - labben-data:/data
    environment:
      - COMPOSE_DIR=/data/compose
      - DATA_DIR=/data
      - DOCKER_SOCKET=/var/run/docker.sock
      # Required for production — set to your domain and URL:
      - AUTH_RP_ID=labben.example.com
      - AUTH_ORIGIN=https://labben.example.com
      # Recommended — set a stable secret so sessions survive restarts:
      - AUTH_SESSION_SECRET=replace-with-a-random-64-char-string
    restart: unless-stopped

volumes:
  labben-data:
```

Then run:

```bash
docker compose up -d
```

Labben is now available at `http://localhost:3005`. On first visit you'll be asked to create your account with a passkey.

### Mounting existing Compose projects

To manage Compose projects that already exist on the host, bind-mount the directory and set `COMPOSE_HOST_DIR` to the host-side path:

```yaml
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /path/to/your/compose/projects:/data/compose
      - labben-data:/data/db
    environment:
      - COMPOSE_DIR=/data/compose
      - COMPOSE_HOST_DIR=/path/to/your/compose/projects
      - DATA_DIR=/data/db
```

> **Important:** `COMPOSE_HOST_DIR` must match the host-side path of your bind-mount. This is needed because Docker Compose commands run inside the container but the Docker daemon resolves volume mounts from the host filesystem.

### Backups

Mount a backup destination (e.g. a NAS or external drive) and configure the schedule in Labben's Backup page:

```yaml
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /path/to/your/compose/projects:/data/compose
      - /mnt/nas/backups:/backups
      - labben-data:/data/db
    environment:
      - COMPOSE_DIR=/data/compose
      - DATA_DIR=/data/db
```

Then go to **Backup** in Labben, set the destination to `/backups`, choose your schedule (days and time), and enable it. Backups include all project files, data, and Labben's own database.

Backups are incremental (rsync) and use hardlinks for history, so they're fast and space-efficient.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPOSE_DIR` | `/data/compose` | Directory for Compose project files |
| `DATA_DIR` | `/data` | Directory for application data (SQLite database) |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Path to Docker socket |
| `PORT` | `3005` | Port the app listens on |
| `AUTH_RP_ID` | `localhost` | WebAuthn Relying Party ID — set to your domain in production (e.g. `labben.example.com`) |
| `AUTH_ORIGIN` | `http://localhost:3005` | Full origin URL — must match how users access Labben (e.g. `https://labben.example.com`) |
| `AUTH_SESSION_SECRET` | Auto-generated | Secret for encrypting session cookies. Set a stable value in production so sessions survive container restarts |

> **Note:** Passkeys require HTTPS in production. `localhost` is exempted for development.

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
- **Backup:** rsync with node-cron scheduling
- **Package manager:** pnpm

## License

MIT
