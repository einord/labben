<script setup lang="ts">
import type { ComposeProject } from '~/types/docker'

interface ProjectListItemProps {
  /** The project to display */
  project: ComposeProject
  /** Whether this item is currently selected */
  selected: boolean
}

const props = defineProps<ProjectListItemProps>()
defineEmits<{ select: [] }>()

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
    :class="{ selected }"
    @click="$emit('select')"
  >
    <span class="name">{{ project.name }}</span>
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

.name {
  font-weight: 500;
  font-size: var(--font-size-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
