<script setup lang="ts">
interface DashboardCard {
  title: string
  icon: string
  description: string
  to: string
}

const cards: DashboardCard[] = [
  {
    title: 'Docker Containers',
    icon: 'lucide:container',
    description: 'Monitor and manage running containers, images, and networks.',
    to: '/containers',
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
      subtitle="Welcome to Labben — your homelab at a glance."
    />

    <div class="card-grid">
      <UiCard
        v-for="card in cards"
        :key="card.title"
        hoverable
        :to="card.to"
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
</style>
