<script setup lang="ts">
const { status, fetchStatus, fetchSites, startContainer, stopContainer } = useStaticSites()

const containerLoading = ref(false)

async function handleToggleContainer() {
  containerLoading.value = true
  if (status.value.containerRunning) {
    await stopContainer()
  } else {
    await startContainer()
  }
  containerLoading.value = false
}

onMounted(async () => {
  await Promise.all([fetchStatus(), fetchSites()])
})
</script>

<template>
  <div>
    <UiPageHeader
      :title="$t('staticSites.title')"
      :subtitle="$t('staticSites.subtitle')"
    >
      <template v-if="status.managedContainerExists" #actions>
        <UiBadge
          :variant="status.containerRunning ? 'success' : 'neutral'"
          dot
          size="sm"
        >
          {{ status.containerRunning ? $t('staticSites.containerRunning') : $t('staticSites.containerStopped') }}
        </UiBadge>
        <UiButton
          :variant="status.containerRunning ? 'ghost' : 'primary'"
          size="sm"
          :icon="status.containerRunning ? 'lucide:square' : 'lucide:play'"
          :loading="containerLoading"
          @click="handleToggleContainer"
        >
          {{ status.containerRunning ? $t('staticSites.stopContainer') : $t('staticSites.startContainer') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="static-sites-content">
      <StaticSitesSetup v-if="!status.managedContainerExists" />
      <StaticSitesList v-else />
    </div>
  </div>
</template>

<style scoped>
.static-sites-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
</style>
