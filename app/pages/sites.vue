<script setup lang="ts">
const { status, fetchStatus, fetchSites, startContainer, stopContainer } = useStaticSites()
const { proxyProject, fetchProxySettings } = useProxy()
const npm = useNpm()

const containerLoading = ref(false)
const npmReady = computed(() => !!proxyProject.value && npm.status.value.connected)

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
  await Promise.all([fetchStatus(), fetchSites(), fetchProxySettings(), npm.fetchStatus()])
  if (npm.status.value.connected) {
    await npm.fetchProxyHosts()
  }
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
      <UiAlert
        v-if="!proxyProject"
        icon="lucide:shield-alert"
        :title="$t('staticSites.noProxy')"
        :description="$t('staticSites.noProxyDescription')"
        variant="warning"
      >
        <template #actions>
          <NuxtLink to="/proxy">
            <UiButton variant="secondary" size="sm" icon="lucide:settings">
              {{ $t('staticSites.configureProxy') }}
            </UiButton>
          </NuxtLink>
        </template>
      </UiAlert>

      <StaticSitesSetup v-if="!status.managedContainerExists" />
      <StaticSitesList v-else :npm-ready="npmReady" :proxy-hosts="npm.proxyHosts.value" />
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
