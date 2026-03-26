<script setup lang="ts">
import type { ContainerSummary } from '~/types/docker'
import type { NpmProxyHost } from '~/types/npm'
import { formatContainerName, statusToVariant } from '~/utils/docker'

interface ContainerListItemProps {
  /** The container to display */
  container: ContainerSummary
  /** Whether an action is in progress for this container */
  loading?: boolean
  /** Proxy hosts currently pointing to this container */
  proxyHosts?: NpmProxyHost[]
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
const matchedHosts = computed(() => props.proxyHosts ?? [])
const hasProxyHosts = computed(() => matchedHosts.value.length > 0)

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
    <div class="header-row">
      <div class="name-status">
        <span class="name">{{ displayName }}</span>
        <UiBadge :variant="variant" dot size="sm">
          {{ container.status }}
        </UiBadge>
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

    <div class="meta-row">
      <span class="image">{{ container.image }}</span>
      <span v-if="portsDisplay" class="ports">{{ portsDisplay }}</span>
    </div>

    <div v-if="hasProxyHosts" class="proxy-row" @click.prevent.stop>
      <a
        v-for="host in matchedHosts"
        :key="host.id"
        :href="`${host.sslForced ? 'https' : 'http'}://${host.domainNames[0]}`"
        target="_blank"
        rel="noopener noreferrer"
        class="domain-link"
        @click.stop
      >
        <UiBadge variant="info" size="sm">
          <Icon name="lucide:globe" class="domain-icon" />
          {{ host.domainNames[0] }}
        </UiBadge>
      </a>
    </div>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
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

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.name-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.name {
  font-weight: 600;
  color: var(--color-text-bright);
  font-size: var(--font-size-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.image {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ports {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  white-space: nowrap;
}

.proxy-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.domain-link {
  text-decoration: none;
}

.domain-icon {
  font-size: var(--font-size-xs);
}
</style>
