<script setup lang="ts">
const { proxyHosts, loading, fetchProxyHosts, status } = useNpm()

onMounted(async () => {
  if (status.value.connected) {
    await fetchProxyHosts()
  }
})

watch(() => status.value.connected, async (connected) => {
  if (connected) {
    await fetchProxyHosts()
  }
})
</script>

<template>
  <UiCard v-if="status.connected">
    <template #header>Proxy Hosts</template>
    <div v-if="loading" class="loading-wrapper">
      <UiSpinner size="md" />
    </div>
    <div v-else-if="proxyHosts.length === 0" class="empty-message">
      Inga proxy hosts konfigurerade i NPM.
    </div>
    <div v-else class="host-list">
      <div v-for="host in proxyHosts" :key="host.id" class="host-item">
        <div class="host-domains">
          <UiBadge v-for="domain in host.domainNames" :key="domain" variant="info" size="sm">
            {{ domain }}
          </UiBadge>
        </div>
        <div class="host-target">
          <span class="target-text">{{ host.forwardScheme }}://{{ host.forwardHost }}:{{ host.forwardPort }}</span>
          <UiBadge :variant="host.enabled ? 'success' : 'neutral'" dot size="sm">
            {{ host.enabled ? 'Aktiv' : 'Inaktiv' }}
          </UiBadge>
          <UiBadge v-if="host.sslForced" variant="success" size="sm">SSL</UiBadge>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}

.empty-message {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--spacing-md) 0;
}

.host-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.host-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.host-domains {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.host-target {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.target-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}
</style>
