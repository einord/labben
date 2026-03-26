<script setup lang="ts">
interface DashboardCard {
  title: string
  icon: string
  description: string
  to: string
  featured?: boolean
}

const { t } = useI18n()

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
</script>

<template>
  <div class="dashboard">
    <UiPageHeader
      :title="$t('dashboard.title')"
      :subtitle="$t('dashboard.subtitle')"
    />

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
