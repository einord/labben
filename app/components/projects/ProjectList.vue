<script setup lang="ts">
import type { ComposeProject } from '~/types/docker'

interface ProjectListProps {
  /** List of projects to display */
  projects: ComposeProject[]
  /** Currently selected project name */
  selectedName?: string
  /** Whether the list is loading */
  loading: boolean
}

defineProps<ProjectListProps>()

const emit = defineEmits<{
  select: [name: string]
}>()
</script>

<template>
  <div class="project-list">
    <div v-if="loading && projects.length === 0" class="loading-wrapper">
      <UiSpinner size="md" />
    </div>
    <UiEmptyState
      v-else-if="projects.length === 0"
      icon="lucide:folder-open"
      title="Inga projekt"
      description="Skapa ett nytt projekt för att komma igång."
    />
    <template v-else>
      <ProjectListItem
        v-for="project in projects"
        :key="project.name"
        :project="project"
        :selected="project.name === selectedName"
        @select="emit('select', project.name)"
      />
    </template>
  </div>
</template>

<style scoped>
.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}
</style>
