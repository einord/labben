# Labben - Project Guidelines

Homelab management tool built with Nuxt 3 / Vue 3 / TypeScript.

## Tech Stack

- **Frontend:** Nuxt 3, Vue 3 (Composition API + `<script setup>`), TypeScript
- **Backend:** Nitro server routes (built into Nuxt)
- **Auth:** WebAuthn passkeys via @simplewebauthn
- **Database:** SQLite via better-sqlite3
- **Docker:** Dockerode + Docker CLI for compose commands
- **i18n:** @nuxtjs/i18n with English (default) and Swedish
- **Package manager:** pnpm
- **Runtime:** Node 22, Docker

## Architecture Overview

### Data Flow

```
Pages → Composables → $fetch → API Routes → Services → Database/Docker
```

### Server Services (Singletons)

All services use the `globalThis` persistence pattern for HMR survival:

- `dockerService` — Docker container and compose project management
- `databaseService` — SQLite CRUD (users, projects, groups, settings, backup)
- `projectService` — Orchestrates Docker + DB, project metadata merging
- `authService` — WebAuthn registration/authentication, sessions
- `npmApiService` — Nginx Proxy Manager REST API client
- `backupService` — rsync backup with scheduled automation

### Container Path Mapping

When running in Docker, compose files are read from container paths (`/data/compose/...`) but Docker Compose commands need host paths for volume mounts. `COMPOSE_HOST_DIR` env var maps between them, and a symlink is created at startup so the CLI can read files via host paths.

### Configuration

Fixed container paths (no env vars needed):
- `/data/compose` — compose project files
- `/data/db` — SQLite database
- `/backups` — backup destination

User configuration via `.env`:
- `COMPOSE_PATH` (required) — host path to compose projects
- `BACKUP_PATH` (optional) — host path for backup destination
- `AUTH_RP_ID`, `AUTH_ORIGIN`, `AUTH_SESSION_SECRET` (optional) — for public access

## Code Style & Structure

### File Size & Responsibility

- **Max 400 lines per file.** If a file approaches this limit, split it.
- **Single responsibility.** Each file does one thing. A component renders one piece of UI. A composable manages one concern. A server route handles one endpoint.
- **No god-components.** If a component takes more than 5-6 props or manages multiple unrelated pieces of state, break it apart.

### File Naming & Nesting

Related files are grouped by name prefix with dot-separation:

```
components/
  ContainerList.vue
  ContainerList.types.ts
  ContainerList.Item.vue
  ContainerList.Item.Actions.vue
```

- The root component owns the namespace (e.g. `ContainerList`).
- Sub-components, types, utilities and tests are nested under that prefix.
- Nuxt auto-imports components — the file name IS the component name (`<ContainerListItem />`).

### Directory Structure

```
app/
  assets/css/          # Global styles and theme files
    variables.css      # Shared design tokens (spacing, radius, typography)
    themes/            # One CSS file per theme (standard, ocean, forest, etc.)
  components/          # Reusable UI components
    ui/                # Generic base components (UiButton, UiCard, UiModal, UiDrawer, etc.)
    settings/          # App settings components (AppSettings, ProxySettings, BackupSettings)
    projects/          # Project feature components
    containers/        # Container feature components
    proxy/             # Proxy feature components
    backup/            # Backup feature components
    auth/              # Authentication components
  composables/         # Shared composable functions
  layouts/             # Nuxt layouts
  middleware/          # Client-side route middleware (auth.global.ts)
  pages/               # Route pages — thin wrappers, minimal logic
  plugins/             # Nuxt plugins (theme.client.ts)
  utils/               # Pure utility functions
  types/               # Shared TypeScript types (docker, project, auth, npm, backup)
i18n/
  locales/             # Translation files (en.json, sv.json)
server/
  api/                 # Nitro API routes
    auth/              # Authentication endpoints
    backup/            # Backup endpoints
    containers/        # Container endpoints
    groups/            # Group CRUD endpoints
    npm/               # NPM API proxy endpoints
    projects/          # Project endpoints
    settings/          # Settings endpoints
    system/            # System status endpoints
  middleware/          # Server-side middleware (auth.ts)
  services/            # Business logic singletons
  utils/               # Server utilities (errors.ts, compose.ts)
```

### Pages are Thin

Pages are composition layers, not implementation layers. A page should:
- Compose components together
- Contain virtually no raw HTML — only component tags
- Delegate logic to composables
- Delegate UI to components

### Components & Reusability

- **Build a UI component library in `components/ui/`.** Buttons, cards, badges, modals, drawers, inputs, spinners, toasts, setup guides — all should be reusable.
- **Prefer props and slots over duplication.**
- **Use slots for flexible content.**
- **Prefix base components with `Ui`.** E.g. `UiButton`, `UiCard`, `UiModal`, `UiDrawer`, `UiSetupGuide`.

### CSS

- **Scoped styles only.** Always use `<style scoped>` in components.
- **Nested selectors with simple class names.**
- **Use CSS custom properties for theming.** All colors, spacing, radii defined as variables.
- **Theme system:** `[data-theme="palette-variant"]` selectors in separate CSS files.
- **No utility-class frameworks** (Tailwind, UnoCSS). Write explicit scoped CSS.

### TypeScript

- **Strict types everywhere.** No `any`. Use `unknown` + type guards when genuinely unknown.
- **Define interfaces for all data shapes** — API responses, component props, composable return values.
- **Colocate types with their consumer.** Feature-specific types in `FeatureName.types.ts`. Shared types in `types/`.
- **Use `type` for unions/intersections, `interface` for object shapes.**

### Composables

- **One concern per composable.** `useContainers()`, `useBackup()`, `useAuth()`, `useNpm()`, etc.
- **Prefix with `use`.**
- **Return typed refs and functions.**
- **Keep server calls in composables, not in components.**
- **Use `useState()` for state shared across components** (not `ref()`). E.g. `useProxy`, `useNpm`, `useBackup` config.

### Server / API Routes

- **One route per file.** Use Nitro file-based routing.
- **Business logic in `server/services/`.** API routes are thin — validate input, call service, return response.
- **Validate all input.** Never trust data from the client.
- **Return consistent response shapes:** `{ success: boolean, data?: T }`.
- **Use `extractErrorMessage()` from `server/utils/errors.ts`** to pass meaningful errors to the client.
- **Auth middleware** protects all `/api/*` routes except public auth endpoints.

### i18n

- **All UI text via i18n keys.** Use `$t('key')` in templates, `t('key')` in script.
- **English as default locale**, Swedish as additional.
- **Translation files in `i18n/locales/`** organized by domain (nav, projects, proxy, backup, auth, toast, etc.).
- **Toast messages** use i18n: `toast.success(t('toast.projectStarted'))`.

### Error Handling

- **Server:** Throw `createError()` with appropriate HTTP status codes. Use `extractErrorMessage()` for upstream errors.
- **Client:** Handle errors in composables. Error toasts are persistent (stay until dismissed) with expandable details.
- **Toast details:** Pass server error message as second argument: `toast.error(t('toast.key'), extractErrorDetails(err))`.

### General

- **No magic strings.** Use constants or enums for repeated string values.
- **No commented-out code.** Delete it. Git has history.
- **Comments explain why, not what.**
- **All code, comments, and variable names in English.** UI text via i18n (English + Swedish).
