import { resolve } from 'node:path'

/** Resolved compose directory path — single source of truth for COMPOSE_PATH. */
export const composePath = resolve(process.env.COMPOSE_PATH || '/data/compose')

/** Host-side compose directory — needed so Docker daemon can resolve volume mounts inside the container. */
export const composeHostDir: string | null = process.env.COMPOSE_HOST_DIR || null
