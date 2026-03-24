<script setup lang="ts">
import type { ContainerDetail } from '~/types/docker'
import { formatContainerName, statusToVariant } from '~/utils/docker'

interface ContainerDetailProps {
  /** The container to display details for */
  container: ContainerDetail
}

const props = defineProps<ContainerDetailProps>()

const displayName = computed(() => formatContainerName(props.container.name))
const variant = computed(() => statusToVariant(props.container.status))

const portsDisplay = computed(() => {
  return props.container.ports
    .filter(p => p.public)
    .map(p => `${p.public}:${p.private}/${p.type}`)
    .join(', ')
})

const createdDate = computed(() => {
  return new Date(props.container.createdAt).toLocaleString('sv-SE')
})
</script>

<template>
  <div class="detail">
    <UiCard>
      <template #header>Information</template>
      <dl class="info-grid">
        <div class="info-item">
          <dt>Status</dt>
          <dd>
            <UiBadge :variant="variant" dot>{{ container.status }}</UiBadge>
            <span class="status-text">{{ container.statusText }}</span>
          </dd>
        </div>
        <div class="info-item">
          <dt>Image</dt>
          <dd class="mono">{{ container.image }}</dd>
        </div>
        <div class="info-item">
          <dt>Portar</dt>
          <dd class="mono">{{ portsDisplay || 'Inga mappade portar' }}</dd>
        </div>
        <div class="info-item">
          <dt>Skapad</dt>
          <dd>{{ createdDate }}</dd>
        </div>
        <div v-if="container.command" class="info-item">
          <dt>Kommando</dt>
          <dd class="mono">{{ container.command }}</dd>
        </div>
        <div class="info-item">
          <dt>Restart Policy</dt>
          <dd>{{ container.restartPolicy }}</dd>
        </div>
      </dl>
    </UiCard>

    <UiCard v-if="container.env.length > 0">
      <template #header>Miljövariabler</template>
      <div class="env-list">
        <div v-for="envVar in container.env" :key="envVar" class="env-item mono">
          {{ envVar }}
        </div>
      </div>
    </UiCard>

    <UiCard v-if="container.volumes.length > 0">
      <template #header>Volymer</template>
      <div class="volumes-list">
        <div v-for="vol in container.volumes" :key="vol.destination" class="volume-item">
          <span class="mono">{{ vol.source }}</span>
          <Icon name="lucide:arrow-right" class="arrow-icon" />
          <span class="mono">{{ vol.destination }}</span>
          <UiBadge v-if="vol.mode" size="sm" variant="neutral">{{ vol.mode }}</UiBadge>
        </div>
      </div>
    </UiCard>

    <UiCard v-if="container.networks.length > 0">
      <template #header>Nätverk</template>
      <div class="networks-list">
        <UiBadge v-for="network in container.networks" :key="network" variant="info" size="sm">
          {{ network }}
        </UiBadge>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  > dt {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  > dd {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
}

.mono {
  font-family: monospace;
  font-size: var(--font-size-sm);
}

.status-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.env-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 300px;
  overflow-y: auto;
}

.env-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  word-break: break-all;
}

.volumes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.volume-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.arrow-icon {
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  flex-shrink: 0;
}

.networks-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
</style>
