<script setup lang="ts">
import type { ProjectWithMetadata, ProjectGroup } from '~/types/project'

interface ProjectListProps {
  /** List of projects to display */
  projects: ProjectWithMetadata[]
  /** Currently selected project name */
  selectedName?: string
  /** Whether the list is loading */
  loading: boolean
  /** Groups for organizing projects */
  groups?: ProjectGroup[]
}

const props = defineProps<ProjectListProps>()

const emit = defineEmits<{
  select: [name: string]
}>()

interface ListSection {
  key: string
  label: string
  icon: string
  projects: ProjectWithMetadata[]
}

const managedProjects = computed(() => props.projects.filter(p => p.source === 'managed'))
const externalProjects = computed(() => props.projects.filter(p => p.source === 'external'))
const missingProjects = computed(() => props.projects.filter(p => p.source === 'missing'))

const sections = computed<ListSection[]>(() => {
  const result: ListSection[] = []

  // Managed projects: group by user-defined groups
  if (props.groups && props.groups.length > 0) {
    for (const group of props.groups) {
      const groupProjects = managedProjects.value.filter(p => p.metadata.groupId === group.id)
      if (groupProjects.length > 0) {
        result.push({ key: `group-${group.id}`, label: group.name, icon: 'lucide:folder', projects: groupProjects })
      }
    }
    const ungrouped = managedProjects.value.filter(p => !p.metadata.groupId)
    if (ungrouped.length > 0) {
      const label = result.length > 0 ? 'Ogrupperade' : ''
      result.push({ key: 'ungrouped', label, icon: 'lucide:inbox', projects: ungrouped })
    }
  } else {
    if (managedProjects.value.length > 0) {
      result.push({ key: 'all', label: '', icon: '', projects: managedProjects.value })
    }
  }

  // External projects (from Docker, not in COMPOSE_DIR)
  if (externalProjects.value.length > 0) {
    result.push({ key: 'external', label: 'Externa', icon: 'lucide:external-link', projects: externalProjects.value })
  }

  // Missing projects (in DB but not on disk/Docker)
  if (missingProjects.value.length > 0) {
    result.push({ key: 'missing', label: 'Saknade', icon: 'lucide:alert-triangle', projects: missingProjects.value })
  }

  return result
})
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
      <div v-for="section in sections" :key="section.key" class="group-section">
        <div v-if="section.label" class="group-header">
          <Icon :name="section.icon" class="group-icon" />
          <span class="group-name">{{ section.label }}</span>
          <span class="group-count">{{ section.projects.length }}</span>
        </div>
        <div class="group-items">
          <ProjectListItem
            v-for="project in section.projects"
            :key="project.name"
            :project="project"
            :selected="project.name === selectedName"
            @select="emit('select', project.name)"
          />
        </div>
      </div>
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

.group-section {
  display: flex;
  flex-direction: column;
}

.group-section + .group-section {
  margin-top: var(--spacing-md);
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.group-icon {
  font-size: var(--font-size-sm);
}

.group-count {
  margin-left: auto;
  font-weight: 400;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
</style>
