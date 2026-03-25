<script setup lang="ts">
import type { ProjectWithMetadata } from '~/types/project'

interface ProjectListItemProps {
  /** The project to display */
  project: ProjectWithMetadata
  /** Whether this item is currently selected */
  selected: boolean
}

const props = defineProps<ProjectListItemProps>()
defineEmits<{ select: [] }>()

const displayName = computed(() => props.project.metadata.displayName ?? props.project.name)

const statusVariant = computed(() => {
  if (props.project.runningCount === 0) return 'danger' as const
  if (props.project.runningCount < props.project.totalCount) return 'warning' as const
  return 'success' as const
})

const statusLabel = computed(() => {
  return `${props.project.runningCount}/${props.project.totalCount}`
})
</script>

<template>
  <button
    class="list-item"
    :class="{ selected, missing: project.source === 'missing', external: project.source === 'external' }"
    @click="$emit('select')"
  >
    <div class="item-content">
      <Icon v-if="project.source === 'missing'" name="lucide:alert-triangle" class="status-icon missing-icon" />
      <Icon v-else-if="project.source === 'external'" name="lucide:external-link" class="status-icon external-icon" />
      <span class="name">{{ displayName }}</span>
    </div>
    <UiBadge :variant="statusVariant" dot size="sm">
      {{ statusLabel }}
    </UiBadge>
  </button>
</template>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  color: var(--color-text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
  width: 100%;

  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text);
  }

  &.selected {
    background-color: var(--color-accent-dim);
    color: var(--color-accent);
  }
}

.item-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
}

.name {
  font-weight: 500;
  font-size: var(--font-size-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.missing {
  opacity: 0.5;
}

.external {
  opacity: 0.8;
}

.status-icon {
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.missing-icon {
  color: var(--color-warning);
}

.external-icon {
  color: var(--color-text-muted);
}
</style>
