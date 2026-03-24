import type { ContainerStatus, StatusVariant } from '~/types/docker'

/** Map a container status to a badge variant */
export function statusToVariant(status: ContainerStatus): StatusVariant {
  const map: Record<ContainerStatus, StatusVariant> = {
    running: 'success',
    exited: 'danger',
    dead: 'danger',
    paused: 'warning',
    restarting: 'info',
    created: 'neutral',
    removing: 'neutral',
  }
  return map[status] ?? 'neutral'
}

/** Remove the leading "/" from Docker container names */
export function formatContainerName(name: string): string {
  return name.startsWith('/') ? name.slice(1) : name
}
