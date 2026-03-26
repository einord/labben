# Labben

A self-hosted homelab management dashboard for Docker. Manage your Compose projects, containers, and reverse proxy configuration — all from one clean interface.

## Features

- **Project management** — Create, start, stop, and configure Docker Compose projects from a master-detail UI
- **Container overview** — Monitor status, ports, volumes, environment variables, and live logs for all your containers
- **Nginx Proxy Manager integration** — Connect to NPM's API to create and manage proxy hosts directly from your project view
- **Smart proxy suggestions** — Configurable base domain with one-click "Publish" to expose services
- **Project grouping** — Organize projects into custom groups, with automatic detection of external and system projects
- **Self-aware** — Labben detects its own container and prevents accidental self-shutdown
- **Themes** — 6 color palettes (Standard, Ocean, Forest, Sunset, Neon, Contrast) with dark/light/auto modes
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
    restart: unless-stopped

volumes:
  labben-data:
```

Then run:

```bash
docker compose up -d
```

Labben is now available at `http://localhost:3005`.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPOSE_DIR` | `/data/compose` | Directory for Compose project files |
| `DATA_DIR` | `/data` | Directory for application data (SQLite database) |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Path to Docker socket |
| `PORT` | `3005` | Port the app listens on |

## Development

```bash
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:3005`. Create a `.env` file for local settings (see `.env.example`).

## Tech stack

- **Frontend:** Nuxt 3, Vue 3, TypeScript
- **Backend:** Nitro server routes
- **Database:** SQLite (better-sqlite3)
- **Docker:** Dockerode for container management
- **Package manager:** pnpm

## License

MIT
