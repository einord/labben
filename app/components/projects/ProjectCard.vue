<script setup lang="ts">
import type { ComposeProject } from '~/types/docker'

interface ProjectCardProps {
  /** The compose project to display */
  project: ComposeProject
}

const props = defineProps<ProjectCardProps>()

defineEmits<{
  up: []
  down: []
  restart: []
  pull: []
}>()

const statusLabel = computed(() => {
  return `${props.project.runningCount}/${props.project.totalCount} containrar igång`
})

const statusVariant = computed(() => {
  if (props.project.runningCount === 0) return 'danger' as const
  if (props.project.runningCount < props.project.totalCount) return 'warning' as const
  return 'success' as const
})

function containerStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
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
</script>

<template>
  <UiCard hoverable :to="`/projects/${project.name}`">
    <template #header>
      <div class="card-header">
        <span class="project-name">{{ project.name }}</span>
        <UiBadge :variant="statusVariant" dot size="sm">
          {{ statusLabel }}
        </UiBadge>
      </div>
    </template>

    <div class="container-rows">
      <div
        v-for="container in project.containers"
        :key="container.id"
        class="container-row"
      >
        <span class="container-name">{{ container.name }}</span>
        <UiBadge :variant="containerStatusVariant(container.status)" size="sm">
          {{ container.status }}
        </UiBadge>
      </div>
    </div>

    <template #footer>
      <div class="card-actions" @click.prevent.stop>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:download"
          @click="$emit('pull')"
        >
          Pull
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:play"
          @click="$emit('up')"
        >
          Up
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:refresh-cw"
          @click="$emit('restart')"
        >
          Restart
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:square"
          @click="$emit('down')"
        >
          Down
        </UiButton>
      </div>
    </template>
  </UiCard>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.project-name {
  font-weight: 600;
  color: var(--color-text-bright);
}

.container-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.container-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.container-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
</style>
