<script setup lang="ts">
import type { ProjectWithMetadata } from '~/types/project'

interface ProjectDetailInfoProps {
  /** The compose project to display details for */
  project: ProjectWithMetadata
}

const props = defineProps<ProjectDetailInfoProps>()

const isMissing = computed(() => props.project.source === 'missing')

defineEmits<{
  up: []
  down: []
  restart: []
  pull: []
  settings: []
}>()

const statusLabel = computed(() => {
  return `${props.project.runningCount}/${props.project.totalCount} containrar igång`
})

const statusVariant = computed(() => {
  if (props.project.runningCount === 0) return 'danger' as const
  if (props.project.runningCount < props.project.totalCount) return 'warning' as const
  return 'success' as const
})
</script>

<template>
  <div class="project-info">
    <UiPageHeader :title="project.name">
      <template #actions>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:download"
          :disabled="isMissing"
          @click="$emit('pull')"
        >
          Pull
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:play"
          :disabled="isMissing"
          @click="$emit('up')"
        >
          Up
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:refresh-cw"
          :disabled="isMissing"
          @click="$emit('restart')"
        >
          Restart
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:square"
          :disabled="isMissing"
          @click="$emit('down')"
        >
          Down
        </UiButton>
        <UiButton
          v-if="!isMissing"
          variant="ghost"
          size="sm"
          icon="lucide:settings"
          @click="$emit('settings')"
        />
      </template>
    </UiPageHeader>

    <div class="meta">
      <UiBadge :variant="statusVariant" dot>
        {{ statusLabel }}
      </UiBadge>
      <span class="config-path">{{ project.configPath }}</span>
    </div>
  </div>
</template>

<style scoped>
.project-info {
  display: flex;
  flex-direction: column;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: calc(-1 * var(--spacing-md));
  margin-bottom: var(--spacing-lg);
}

.config-path {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}
</style>
