<script setup lang="ts">
const {
  projects,
  selectedProjectName,
  selectedProject,
  projectContainers,
  selectedContainerId,
  loading,
  projectsLoading,
  containersLoading,
  createProject,
  init,
  refreshAll,
  selectProject,
  selectContainer,
  closeContainerDrawer,
  handleUp,
  handleDown,
  handleRestart,
  handlePull,
  handleStartContainer,
  handleStopContainer,
  handleRestartContainer,
} = useProjectsView()

const showCreateModal = ref(false)
const showSettings = ref(false)

async function handleCreated() {
  await refreshAll()
}

onMounted(() => init())
</script>

<template>
  <div class="projects-page">
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
          @click="refreshAll"
        >
          Uppdatera
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="master-detail">
      <aside class="list-panel">
        <ProjectList
          :projects="projects"
          :selected-name="selectedProjectName"
          :loading="projectsLoading"
          @select="selectProject"
        />
      </aside>

      <main class="detail-panel">
        <template v-if="selectedProject">
          <ProjectDetailInfo
            :project="selectedProject"
            @up="handleUp"
            @down="handleDown"
            @restart="handleRestart"
            @pull="handlePull"
            @settings="showSettings = true"
          />

          <section class="containers-section">
            <h3 class="section-title">Containrar</h3>
            <ContainerList
              :containers="projectContainers"
              :loading="containersLoading"
              @start="handleStartContainer"
              @stop="handleStopContainer"
              @restart="handleRestartContainer"
              @select="selectContainer"
            />
          </section>
        </template>

        <UiEmptyState
          v-else
          icon="lucide:folder-open"
          title="Välj ett projekt"
          description="Välj ett projekt i listan till vänster för att se detaljer."
        />
      </main>
    </div>

    <ProjectCreateModal
      v-model="showCreateModal"
      @created="handleCreated"
    />

    <ProjectSettings
      v-if="selectedProjectName"
      v-model="showSettings"
      :project-name="selectedProjectName"
    />

    <ProjectContainerDrawer
      :container-id="selectedContainerId"
      @close="closeContainerDrawer"
    />
  </div>
</template>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 2 * var(--spacing-xl));
}

.master-detail {
  display: flex;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

.list-panel {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-right: var(--spacing-md);
  border-right: 1px solid var(--color-border);
}

.detail-panel {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.containers-section {
  margin-top: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0 0 var(--spacing-md) 0;
}

@media (max-width: 768px) {
  .master-detail {
    flex-direction: column;
  }

  .list-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding-right: 0;
    padding-bottom: var(--spacing-md);
    max-height: 200px;
  }
}
</style>
