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
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Welcome to Labben — your homelab at a glance.</p>

    <div class="card-grid">
      <NuxtLink
        v-for="card in cards"
        :key="card.title"
        :to="card.to"
        class="card"
      >
        <Icon :name="card.icon" class="card-icon" />
        <h2 class="card-title">{{ card.title }}</h2>
        <p class="card-description">{{ card.description }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1000px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #f0f0f0;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #888;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.card {
  background-color: #22223a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: #00dc82;
}

.card-icon {
  font-size: 2rem;
  color: #00dc82;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f0f0f0;
}

.card-description {
  font-size: 0.85rem;
  color: #888;
  line-height: 1.5;
}
</style>
