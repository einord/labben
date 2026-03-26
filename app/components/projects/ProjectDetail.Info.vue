<script setup lang="ts">
import type { ProjectWithMetadata } from '~/types/project'

interface ProjectDetailInfoProps {
  /** The compose project to display details for */
  project: ProjectWithMetadata
  /** Whether NPM is connected and base domain is configured */
  canPublish?: boolean
}

const props = withDefaults(defineProps<ProjectDetailInfoProps>(), {
  canPublish: false,
})

const { t } = useI18n()
const isMissing = computed(() => props.project.source === 'missing')
const isSelf = computed(() => props.project.isSelf)

defineEmits<{
  up: []
  down: []
  restart: []
  pull: []
  update: []
  settings: []
  publish: []
}>()

const statusLabel = computed(() => {
  return t('projects.containersRunning', { running: props.project.runningCount, total: props.project.totalCount })
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
          variant="primary"
          size="sm"
          icon="lucide:package-check"
          :disabled="isMissing || isSelf"
          @click="$emit('update')"
        >
          {{ $t('projects.update') }}
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
          :disabled="isMissing || isSelf"
          @click="$emit('restart')"
        >
          Restart
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:square"
          :disabled="isMissing || isSelf"
          @click="$emit('down')"
        >
          Down
        </UiButton>
        <UiButton
          v-if="canPublish && !isMissing"
          variant="secondary"
          size="sm"
          icon="lucide:globe"
          @click="$emit('publish')"
        >
          {{ $t('projects.publish') }}
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
      <span class="config-path" v-html="project.configPath.replace(/\//g, '/&#8203;')" />
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
