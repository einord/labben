<script setup lang="ts">
const { status, baseDomain, fetchBaseDomain, fetchStatus, proxyHosts, fetchProxyHosts } = useNpm()
const { proxyProject } = useProxy()
const { t } = useI18n()

const showLabbenProxyForm = ref(false)

const canPublishLabben = computed(() =>
  proxyProject.value && status.value.connected && baseDomain.value,
)

const labbenDomain = computed(() =>
  baseDomain.value ? `labben.${baseDomain.value}` : '',
)

const labbenAlreadyPublished = computed(() =>
  proxyHosts.value.some(h => h.meta?.labben_project === 'labben'),
)

async function handleLabbenPublished() {
  await fetchProxyHosts()
}

onMounted(async () => {
  await Promise.all([fetchStatus(), fetchBaseDomain()])
  if (status.value.connected) {
    await fetchProxyHosts()
  }
})
</script>

<template>
  <div>
    <UiPageHeader
      :title="$t('proxy.title')"
      :subtitle="$t('proxy.subtitle')"
    />
    <div class="proxy-content">
      <ProxySetup />
      <ProxyCredentials />
      <ProxyBaseDomain />

      <UiCard v-if="canPublishLabben && !labbenAlreadyPublished">
        <template #header>{{ $t('proxy.publishLabben') }}</template>
        <div class="publish-labben">
          <p class="publish-description">{{ $t('proxy.publishLabbenDescription') }}</p>
          <UiButton
            variant="primary"
            size="sm"
            icon="lucide:globe"
            @click="showLabbenProxyForm = true"
          >
            {{ $t('proxy.publishLabben') }}
          </UiButton>
        </div>
      </UiCard>

      <ProxyHosts />
    </div>

    <ProxyHostForm
      v-model="showLabbenProxyForm"
      :suggested-domain="labbenDomain"
      suggested-host="host.docker.internal"
      :suggested-port="3005"
      project-name="labben"
      @saved="handleLabbenPublished"
    />
  </div>
</template>

<style scoped>
.proxy-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.publish-labben {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.publish-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}
</style>
