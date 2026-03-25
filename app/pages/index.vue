<script setup lang="ts">
interface DashboardCard {
  title: string
  icon: string
  description: string
  to: string
  featured?: boolean
}

const cards: DashboardCard[] = [
  {
    title: 'Projekt',
    icon: 'lucide:folder-open',
    description: 'Hantera Docker Compose-projekt, containrar och konfiguration.',
    to: '/projects',
    featured: true,
  },
  {
    title: 'Static Sites',
    icon: 'lucide:globe',
    description: 'Deploy and manage static sites served from your homelab.',
    to: '/sites',
  },
  {
    title: 'Proxy Manager',
    icon: 'lucide:route',
    description: 'Configure reverse proxy rules, SSL certificates, and routing.',
    to: '/proxy',
  },
  {
    title: 'Backup Status',
    icon: 'lucide:hard-drive-download',
    description: 'View backup schedules, history, and restore points.',
    to: '/backup',
  },
]
</script>

<template>
  <div class="dashboard">
    <UiPageHeader
      title="Dashboard"
      subtitle="Välkommen till Labben — ditt homelab i överblick."
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
