<script setup lang="ts">
const { history, fetchHistory } = useBackup()
const { t } = useI18n()

const latestBackup = computed(() => {
  return history.value.find(h => h.status !== 'running') ?? null
})

const statusVariant = computed(() => {
  if (!latestBackup.value) return 'neutral' as const
  if (latestBackup.value.status === 'success') return 'success' as const
  return 'danger' as const
})

const statusText = computed(() => {
  if (!latestBackup.value) return t('backup.neverRun')
  const date = new Date(latestBackup.value.startedAt).toLocaleString()
  return `${t(`backup.status_${latestBackup.value.status}`)} — ${date}`
})

onMounted(() => fetchHistory())
</script>

<template>
  <UiCard>
    <template #header>{{ $t('backup.status') }}</template>
    <div class="status-content">
      <UiBadge :variant="statusVariant" dot>
        {{ statusText }}
      </UiBadge>
    </div>
  </UiCard>
</template>

<style scoped>
.status-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
</style>
