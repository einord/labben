<script setup lang="ts">
const {
  projects,
  groups,
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
  proxyHosts,
  npmStatus,
  baseDomain,
  getProxySuggestion,
} = useProjectsView()

const showCreateModal = ref(false)
const showSettings = ref(false)
const showProxyForm = ref(false)
const proxyFormDomain = ref('')
const proxyFormHost = ref('host.docker.internal')
const proxyFormPort = ref(80)
const proxyFormProject = ref('')

function handleProxyContainer(containerId: string) {
  const suggestion = getProxySuggestion(containerId)
  if (!suggestion) return

  proxyFormDomain.value = suggestion.domain
  proxyFormHost.value = suggestion.host
  proxyFormPort.value = suggestion.port
  proxyFormProject.value = suggestion.project

  showProxyForm.value = true
}

function handlePublish() {
  if (!selectedProject.value || !baseDomain.value) return

  // Use the first container with public ports as default
  const container = projectContainers.value.find(c => c.ports.some(p => p.public))
  if (!container) return

  const suggestion = getProxySuggestion(container.id)
  if (!suggestion) return

  // Use project name as domain prefix instead of container name
  proxyFormDomain.value = `${selectedProject.value.name}.${baseDomain.value}`
  proxyFormHost.value = suggestion.host
  proxyFormPort.value = suggestion.port
  proxyFormProject.value = selectedProject.value.name

  showProxyForm.value = true
}

async function handleCreated() {
  await refreshAll()
}

onMounted(async () => {
  await init()
})
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
          :groups="groups"
          :selected-name="selectedProjectName"
          :loading="projectsLoading"
          @select="selectProject"
        />
      </aside>

      <main class="detail-panel">
        <template v-if="selectedProject">
          <ProjectDetailInfo
            :project="selectedProject"
            :can-publish="!!npmStatus.connected && !!baseDomain"
            @up="handleUp"
            @down="handleDown"
            @restart="handleRestart"
            @pull="handlePull"
            @settings="showSettings = true"
            @publish="handlePublish"
          />

          <section class="containers-section">
            <h3 class="section-title">Containrar</h3>
            <ContainerList
              :containers="projectContainers"
              :loading="containersLoading"
              :proxy-hosts="proxyHosts"
              @start="handleStartContainer"
              @stop="handleStopContainer"
              @restart="handleRestartContainer"
              @select="selectContainer"
              @proxy="handleProxyContainer"
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

    <ProxyHostForm
      v-model="showProxyForm"
      :suggested-domain="proxyFormDomain"
      :suggested-host="proxyFormHost"
      :suggested-port="proxyFormPort"
      :project-name="proxyFormProject"
      @saved="refreshAll"
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
