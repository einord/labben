<script setup lang="ts">
interface DashboardCard {
  title: string
  icon: string
  description: string
  to: string
  featured?: boolean
}

const { t } = useI18n()
const { status, fetchStatus } = useSystemStatus()

const cards = computed<DashboardCard[]>(() => [
  {
    title: t('dashboard.projects'),
    icon: 'lucide:folder-open',
    description: t('dashboard.projectsDescription'),
    to: '/projects',
    featured: true,
  },
  {
    title: t('dashboard.staticSites'),
    icon: 'lucide:globe',
    description: t('dashboard.staticSitesDescription'),
    to: '/sites',
  },
  {
    title: t('dashboard.proxyManager'),
    icon: 'lucide:route',
    description: t('dashboard.proxyManagerDescription'),
    to: '/proxy',
  },
  {
    title: t('dashboard.backupStatus'),
    icon: 'lucide:hard-drive-download',
    description: t('dashboard.backupStatusDescription'),
    to: '/backup',
  },
])

const warnings = computed(() => {
  if (!status.value) return []
  const list: Array<{ icon: string; message: string }> = []
  if (!status.value.dockerSocket.available) {
    list.push({ icon: 'lucide:plug-zap', message: t('system.dockerSocketMissing') })
  }
  if (!status.value.composePath.mounted) {
    list.push({ icon: 'lucide:folder-x', message: t('system.composePathMissing') })
  }
  if (!status.value.auth.configured) {
    list.push({ icon: 'lucide:shield-alert', message: t('system.authNotConfigured') })
  }
  return list
})

onMounted(() => fetchStatus())
</script>

<template>
  <div class="dashboard">
    <UiPageHeader
      :title="$t('dashboard.title')"
      :subtitle="$t('dashboard.subtitle')"
    />

    <ClientOnly>
      <div v-if="warnings.length > 0" class="warnings">
        <div v-for="(warning, i) in warnings" :key="i" class="warning-item">
          <Icon :name="warning.icon" class="warning-icon" />
          <span class="warning-text">{{ warning.message }}</span>
        </div>
      </div>
    </ClientOnly>

    <div class="card-grid">
      <UiCard
        v-for="card in cards"
        :key="card.title"
        hoverable
        :to="card.to"
        :class="{ featured: card.featured }"
      >
        <template #icon>
          <Icon :name="card.icon" />
        </template>
        <template #header>
          {{ card.title }}
        </template>
        {{ card.description }}
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.warnings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.warning-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.warning-icon {
  color: var(--color-warning);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.warning-text {
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
}

.featured {
  grid-column: 1 / -1;
  border-color: var(--color-accent);
  background-color: var(--color-accent-dim);
}

@media (min-width: 600px) {
  .featured {
    grid-column: 1 / span 2;
  }
}
</style>
