<script setup lang="ts">
import type { NpmProxyHost } from '~/types/npm'

const { proxyHosts, loading, fetchProxyHosts, deleteProxyHost, status } = useNpm()

const showForm = ref(false)
const editingHost = ref<NpmProxyHost | null>(null)

function handleAdd() {
  editingHost.value = null
  showForm.value = true
}

function handleEdit(host: NpmProxyHost) {
  editingHost.value = host
  showForm.value = true
}

async function handleDelete(host: NpmProxyHost) {
  await deleteProxyHost(host.id)
}

function handleSaved() {
  fetchProxyHosts()
}

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
    <template #header>
      <div class="hosts-header">
        <span>Proxy Hosts</span>
        <UiButton variant="primary" size="sm" icon="lucide:plus" @click="handleAdd">
          Lägg till
        </UiButton>
      </div>
    </template>
    <div v-if="loading" class="loading-wrapper">
      <UiSpinner size="md" />
    </div>
    <div v-else-if="proxyHosts.length === 0" class="empty-message">
      Inga proxy hosts konfigurerade i NPM.
    </div>
    <div v-else class="host-list">
      <div v-for="host in proxyHosts" :key="host.id" class="host-item">
        <div class="host-main">
          <div class="host-domains">
            <UiBadge v-for="domain in host.domainNames" :key="domain" variant="info" size="sm">
              {{ domain }}
            </UiBadge>
          </div>
          <div class="host-target">
            <span class="target-text">{{ host.forwardScheme }}://{{ host.forwardHost }}:{{ host.forwardPort }}</span>
          </div>
        </div>
        <div class="host-meta">
          <UiBadge :variant="host.enabled ? 'success' : 'neutral'" dot size="sm">
            {{ host.enabled ? 'Aktiv' : 'Inaktiv' }}
          </UiBadge>
          <UiBadge v-if="host.sslForced" variant="success" size="sm">SSL</UiBadge>
          <span v-if="host.meta?.labben_project" class="project-tag">
            {{ host.meta.labben_project }}
          </span>
        </div>
        <div class="host-actions">
          <UiButton variant="ghost" size="sm" icon="lucide:pencil" @click="handleEdit(host)" />
          <UiButton variant="ghost" size="sm" icon="lucide:trash-2" @click="handleDelete(host)" />
        </div>
      </div>
    </div>

    <ProxyHostForm
      v-model="showForm"
      :edit-host="editingHost"
      @saved="handleSaved"
    />
  </UiCard>
</template>

<style scoped>
.hosts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

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
}

.host-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.host-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.host-domains {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.host-target {
  display: flex;
  align-items: center;
}

.target-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}

.host-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.project-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background-color: var(--color-neutral-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
}

.host-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}
</style>
