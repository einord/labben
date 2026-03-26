<script setup lang="ts">
import type { ContainerSummary } from '~/types/docker'

interface ContainerListProps {
  /** List of containers to display */
  containers: ContainerSummary[]
  /** Whether the list is loading */
  loading: boolean
  /** Container IDs currently performing an action */
  loadingIds?: string[]
}

defineProps<ContainerListProps>()

const emit = defineEmits<{
  start: [id: string]
  stop: [id: string]
  restart: [id: string]
  select: [id: string]
  proxy: [id: string]
}>()
</script>

<template>
  <div class="container-list">
    <div v-if="loading" class="loading-wrapper">
      <UiSpinner size="lg" />
    </div>
    <UiEmptyState
      v-else-if="containers.length === 0"
      icon="lucide:container"
      title="Inga containrar hittades"
      description="Det finns inga Docker-containrar att visa just nu."
    />
    <div v-else class="list">
      <ContainerListItem
        v-for="container in containers"
        :key="container.id"
        :container="container"
        :loading="loadingIds?.includes(container.id) ?? false"
        @select="emit('select', container.id)"
        @start="emit('start', container.id)"
        @stop="emit('stop', container.id)"
        @restart="emit('restart', container.id)"
        @proxy="emit('proxy', container.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.container-list {
  display: flex;
  flex-direction: column;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
</style>
