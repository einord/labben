<script setup lang="ts">
const { projects, loading, fetchProjects, projectUp, projectDown, projectRestart, projectPull } = useProjects()

const showCreateModal = ref(false)

async function handleCreated() {
  await fetchProjects()
}

async function handleUp(name: string) {
  await projectUp(name)
  await fetchProjects()
}

async function handleDown(name: string) {
  await projectDown(name)
  await fetchProjects()
}

async function handleRestart(name: string) {
  await projectRestart(name)
  await fetchProjects()
}

async function handlePull(name: string) {
  await projectPull(name)
  await fetchProjects()
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div>
    <UiPageHeader title="Projekt">
      <template #actions>
        <UiButton
          variant="primary"
          size="sm"
          icon="lucide:plus"
          @click="showCreateModal = true"
        >
          Nytt projekt
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:refresh-cw"
          :loading="loading"
          @click="fetchProjects"
        >
          Uppdatera
        </UiButton>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="loading-wrapper">
      <UiSpinner size="lg" />
    </div>
    <UiEmptyState
      v-else-if="projects.length === 0"
      icon="lucide:folder-open"
      title="Inga projekt hittades"
      description="Det finns inga Docker Compose-projekt att visa just nu."
    />
    <div v-else class="project-grid">
      <ProjectCard
        v-for="project in projects"
        :key="project.name"
        :project="project"
        @up="handleUp(project.name)"
        @down="handleDown(project.name)"
        @restart="handleRestart(project.name)"
        @pull="handlePull(project.name)"
      />
    </div>

    <ProjectCreateModal
      v-model="showCreateModal"
      @created="handleCreated"
    />
  </div>
</template>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-lg);
}
</style>
