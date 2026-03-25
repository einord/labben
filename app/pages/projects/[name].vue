<script setup lang="ts">
const route = useRoute()
const projectName = computed(() => route.params.name as string)

const {
  project,
  containers,
  composeContent,
  projectsLoading,
  containersLoading,
  init,
  handleSaveConfig,
  handleUp,
  handleDown,
  handleRestart,
  handlePull,
  handleStartContainer,
  handleStopContainer,
  handleRestartContainer,
} = useProjectDetail(projectName)

onMounted(() => init())
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
            :containers="containers"
            :loading="containersLoading"
            @start="handleStartContainer"
            @stop="handleStopContainer"
            @restart="handleRestartContainer"
          />
        </section>

        <section class="section-editor">
          <UiPageHeader title="Compose" />
          <UiComposeEditor
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
