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

const setupGuides = computed(() => {
  if (!status.value) return []
  const guides: Array<{ icon: string; title: string; description: string; steps: Array<{ text: string; code?: string }> }> = []

  if (!status.value.dockerSocket.available) {
    guides.push({
      icon: 'lucide:plug-zap',
      title: t('system.dockerSocketMissing'),
      description: t('system.dockerSocketDescription'),
      steps: [
        { text: t('system.dockerSocketStep1'), code: '- /var/run/docker.sock:/var/run/docker.sock' },
        { text: t('system.restartStep') },
      ],
    })
  }

  if (!status.value.composePath.mounted) {
    guides.push({
      icon: 'lucide:folder-x',
      title: t('system.composePathMissing'),
      description: t('system.composePathDescription'),
      steps: [
        { text: t('system.composePathStep1'), code: 'COMPOSE_PATH=/path/to/your/compose/projects' },
        { text: t('system.restartStep') },
      ],
    })
  }

  if (status.value.hostPathSymlink.needed && !status.value.hostPathSymlink.ok) {
    guides.push({
      icon: 'lucide:link-2-off',
      title: t('system.symlinkBroken'),
      description: t('system.symlinkBrokenDescription'),
      steps: [
        { text: t('system.symlinkStep1'), code: 'COMPOSE_HOST_DIR=/host/path/to/compose' },
        { text: t('system.symlinkStep2') },
        { text: t('system.restartStep') },
      ],
    })
  }

  if (status.value.composeHostDir.configured && !status.value.composeHostDir.accessible) {
    guides.push({
      icon: 'lucide:folder-search',
      title: t('system.composeHostDirInaccessible'),
      description: t('system.composeHostDirInaccessibleDescription'),
      steps: [
        { text: t('system.composeHostDirStep1'), code: 'COMPOSE_HOST_DIR=/correct/host/path' },
        { text: t('system.restartStep') },
      ],
    })
  }

  if (!status.value.database.writable) {
    guides.push({
      icon: 'lucide:database',
      title: t('system.dbNotWritable'),
      description: t('system.dbNotWritableDescription'),
      steps: [
        { text: t('system.dbStep1'), code: '- /path/on/host:/data/db' },
        { text: t('system.restartStep') },
      ],
    })
  } else if (!status.value.database.mounted) {
    guides.push({
      icon: 'lucide:database',
      title: t('system.dbNotMounted'),
      description: t('system.dbNotMountedDescription'),
      steps: [
        { text: t('system.dbStep1'), code: '- /path/on/host:/data/db' },
        { text: t('system.restartStep') },
      ],
    })
  }

  if (!status.value.auth.configured) {
    guides.push({
      icon: 'lucide:shield-alert',
      title: t('system.authNotConfigured'),
      description: t('system.authNotConfiguredDetail'),
      steps: [
        { text: t('system.authStep1'), code: 'AUTH_RP_ID=labben.example.com' },
        { text: t('system.authStep2'), code: 'AUTH_ORIGIN=https://labben.example.com' },
        { text: t('system.authStep3'), code: 'AUTH_SESSION_SECRET=replace-with-a-random-string' },
        { text: t('system.restartStep') },
      ],
    })
  }

  return guides
})

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
  if (status.value.hostPathSymlink.needed && !status.value.hostPathSymlink.ok) {
    list.push({ icon: 'lucide:link-2-off', message: t('system.symlinkBroken') })
  }
  if (status.value.composeHostDir.configured && !status.value.composeHostDir.accessible) {
    list.push({ icon: 'lucide:folder-search', message: t('system.composeHostDirInaccessible') })
  }
  if (!status.value.database.writable) {
    list.push({ icon: 'lucide:database', message: t('system.dbNotWritable') })
  } else if (!status.value.database.mounted) {
    list.push({ icon: 'lucide:database', message: t('system.dbNotMounted') })
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

    <div class="dashboard-content">
      <ClientOnly>
        <UiSetupGuide v-if="setupGuides.length > 0" :guides="setupGuides" />
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
  </div>
</template>

<style scoped>
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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
