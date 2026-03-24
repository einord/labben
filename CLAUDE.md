# Labben - Project Guidelines

Homelab management tool built with Nuxt 3 / Vue 3 / TypeScript.

## Tech Stack

- **Frontend:** Nuxt 3, Vue 3 (Composition API + `<script setup>`), TypeScript
- **Backend:** Nitro server routes (built into Nuxt)
- **Package manager:** pnpm
- **Runtime:** Node 22, Docker

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
  components/        # Reusable UI components
    ui/              # Generic base components (buttons, cards, modals, lists, etc.)
    layout/          # Layout-specific components (sidebar, header, etc.)
    [feature]/       # Feature-specific components grouped by domain
  composables/       # Shared composable functions (useDocker, useBackup, etc.)
  layouts/           # Nuxt layouts
  pages/             # Route pages — thin wrappers, minimal logic
  utils/             # Pure utility functions (formatting, validation, etc.)
  types/             # Shared TypeScript types and interfaces
server/
  api/               # Nitro API routes
  utils/             # Server-side utility functions
  services/          # Business logic (Docker, NPM, Synology integrations)
```

### Pages are Thin

Pages are composition layers, not implementation layers. A page should:
- Compose components together
- Contain virtually no raw HTML — only component tags
- Delegate logic to composables
- Delegate UI to components

```vue
<!-- GOOD -->
<template>
  <PageHeader title="Containers" />
  <ContainerList :containers="containers" @restart="handleRestart" />
</template>

<!-- BAD -->
<template>
  <div class="header"><h1>Containers</h1></div>
  <div class="list">
    <div v-for="c in containers" class="item">
      <span>{{ c.name }}</span>
      <button @click="restart(c.id)">Restart</button>
    </div>
  </div>
</template>
```

### Components & Reusability

- **Build a UI component library in `components/ui/`.** Buttons, cards, badges, modals, lists, tables, panels, inputs — all should be reusable components.
- **Prefer props and slots over duplication.** If two components look similar, extract a shared base component with props/slots for variation.
- **Use slots for flexible content.** Prefer `<UiCard><template #header>...</template></UiCard>` over a `headerHtml` prop.
- **Prefix base components with `Ui`.** E.g. `UiButton`, `UiCard`, `UiModal`, `UiBadge`.

### CSS

- **Scoped styles only.** Always use `<style scoped>` in components.
- **Nested selectors with simple class names.** The scoped attribute handles isolation — no need for BEM or long prefixes.

```vue
<style scoped>
.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);

  > .header {
    font-weight: 600;
  }

  > .body {
    padding: var(--spacing-md);
  }
}
</style>
```

- **Use CSS custom properties for theming.** Define design tokens (colors, spacing, radii, shadows) as CSS variables in the layout or a global stylesheet. Components consume variables, never hardcode colors or spacing values.
- **No utility-class frameworks** (Tailwind, UnoCSS). Write explicit scoped CSS.

### TypeScript

- **Strict types everywhere.** No `any`. Use `unknown` + type guards when the type is genuinely unknown.
- **Define interfaces for all data shapes** — API responses, component props, composable return values.
- **Colocate types with their consumer.** Feature-specific types live in `FeatureName.types.ts` next to the component. Shared types go in `types/`.
- **Use `type` for unions/intersections, `interface` for object shapes.**

### Composables

- **One concern per composable.** `useContainers()` manages container state. `useBackup()` manages backup state. Don't combine unrelated concerns.
- **Prefix with `use`.** Follow Vue convention: `useDocker`, `useProxyManager`, `useSynology`.
- **Return typed refs and functions.** The consumer should get a clean, typed API.
- **Keep server calls in composables, not in components.** Components call composable methods; composables call `$fetch` / API routes.

### Server / API Routes

- **One route per file.** Use Nitro file-based routing: `server/api/containers/index.get.ts`, `server/api/containers/[id].post.ts`.
- **Business logic in `server/services/`.** API routes are thin — validate input, call service, return response.
- **Validate all input.** Never trust data from the client.
- **Return consistent response shapes.** Use a shared response type or wrapper.

### Error Handling

- **Server:** Throw `createError()` with appropriate HTTP status codes. Never leak internal details to the client.
- **Client:** Handle errors in composables and expose error state to components. Components display errors via UI components, never `console.log` in production code.

### General

- **No magic strings.** Use constants or enums for repeated string values (status codes, event names, config keys).
- **No commented-out code.** Delete it. Git has history.
- **Comments explain why, not what.** The code should be readable enough to explain what it does. Comments are for non-obvious decisions and trade-offs.
- **All code, comments, and variable names in English.** UI text (labels, messages shown to users) may be in Swedish.
