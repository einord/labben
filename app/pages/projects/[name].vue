<script setup lang="ts">
const route = useRoute()
const projectName = computed(() => route.params.name as string)

const {
  projects,
  loading: projectsLoading,
  fetchProjects,
  projectUp,
  projectDown,
  projectRestart,
  projectPull,
  getConfig,
  saveConfig,
} = useProjects()

const {
  containers: allContainers,
  loading: containersLoading,
  fetchContainers,
  startContainer,
  stopContainer,
  restartContainer,
} = useContainers()

const project = computed(() => {
  return projects.value.find(p => p.name === projectName.value)
})

const projectContainers = computed(() => {
  return allContainers.value.filter(c => c.project === projectName.value)
})

const composeContent = ref('')

async function loadConfig() {
  composeContent.value = await getConfig(projectName.value)
}

async function handleSaveConfig() {
  await saveConfig(projectName.value, composeContent.value)
}

async function handleUp() {
  await projectUp(projectName.value)
  await refreshAll()
}

async function handleDown() {
  await projectDown(projectName.value)
  await refreshAll()
}

async function handleRestart() {
  await projectRestart(projectName.value)
  await refreshAll()
}

async function handlePull() {
  await projectPull(projectName.value)
  await refreshAll()
}

async function handleStart(id: string) {
  await startContainer(id)
  await refreshAll()
}

async function handleStop(id: string) {
  await stopContainer(id)
  await refreshAll()
}

async function handleContainerRestart(id: string) {
  await restartContainer(id)
  await refreshAll()
}

async function refreshAll() {
  await Promise.all([fetchProjects(), fetchContainers()])
}

onMounted(async () => {
  await Promise.all([fetchProjects(), fetchContainers(), loadConfig()])
})
</script>

<template>
  <div>
    <div v-if="projectsLoading && !project" class="loading-wrapper">
      <UiSpinner size="lg" />
    </div>

    <template v-else-if="project">
      <ProjectDetailInfo
        :project="project"
        @up="handleUp"
        @down="handleDown"
        @restart="handleRestart"
        @pull="handlePull"
      />

      <div class="content-layout">
        <section class="section-containers">
          <UiPageHeader title="Containrar" />
          <ContainerList
            :containers="projectContainers"
            :loading="containersLoading"
            @start="handleStart"
            @stop="handleStop"
            @restart="handleContainerRestart"
          />
        </section>

        <section class="section-editor">
          <UiPageHeader title="Compose" />
          <ContainersComposeEditor
            v-model="composeContent"
            @save="handleSaveConfig"
          />
        </section>
      </div>
    </template>

    <UiEmptyState
      v-else
      icon="lucide:folder-open"
      title="Projektet hittades inte"
      description="Det gick inte att hitta det begärda projektet."
    />
  </div>
</template>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
}

@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}
</style>
