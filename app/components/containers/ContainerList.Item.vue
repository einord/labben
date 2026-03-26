<script setup lang="ts">
import type { ContainerSummary } from '~/types/docker'
import { formatContainerName, statusToVariant } from '~/utils/docker'

interface ContainerListItemProps {
  /** The container to display */
  container: ContainerSummary
  /** Whether an action is in progress for this container */
  loading?: boolean
}

const props = defineProps<ContainerListItemProps>()

defineEmits<{
  start: []
  stop: []
  restart: []
  select: []
  proxy: []
}>()

const hasPublicPorts = computed(() => props.container.ports.some(p => p.public))

const displayName = computed(() => formatContainerName(props.container.name))
const variant = computed(() => statusToVariant(props.container.status))

const portsDisplay = computed(() => {
  return props.container.ports
    .filter(p => p.public)
    .map(p => `${p.public}:${p.private}`)
    .join(', ')
})
</script>

<template>
  <div class="item" @click="$emit('select')">
    <div class="info">
      <span class="name">{{ displayName }}</span>
      <span class="image">{{ container.image }}</span>
      <UiBadge :variant="variant" dot size="sm">
        {{ container.status }}
      </UiBadge>
      <span v-if="portsDisplay" class="ports">{{ portsDisplay }}</span>
      <span v-if="container.project" class="project">{{ container.project }}</span>
    </div>
    <div class="actions" @click.prevent.stop>
      <UiButton
        v-if="hasPublicPorts"
        variant="ghost"
        size="sm"
        icon="lucide:route"
        @click="$emit('proxy')"
      />
      <ContainerListItemActions
        :status="container.status"
        :loading="loading ?? false"
        @start="$emit('start')"
        @stop="$emit('stop')"
        @restart="$emit('restart')"
      />
    </div>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-accent);
  }
}

.info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
  flex: 1;
}

.name {
  font-weight: 600;
  color: var(--color-text-bright);
  font-size: var(--font-size-md);
  white-space: nowrap;
}

.image {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ports {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-family: monospace;
  white-space: nowrap;
}

.project {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  background-color: var(--color-neutral-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
  white-space: nowrap;
}

.actions {
  flex-shrink: 0;
}
</style>
