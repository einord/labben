<script setup lang="ts">
const { history, running, fetchHistory, runBackup } = useBackup()
const { t } = useI18n()

function formatSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

const statusVariant = (status: string) => {
  if (status === 'success') return 'success' as const
  if (status === 'failed') return 'danger' as const
  return 'warning' as const
}

onMounted(() => fetchHistory())
</script>

<template>
  <UiCard>
    <template #header>
      <div class="history-header">
        <span>{{ $t('backup.history') }}</span>
        <UiButton variant="primary" size="sm" icon="lucide:play" :loading="running" @click="runBackup">
          {{ $t('backup.runNow') }}
        </UiButton>
      </div>
    </template>
    <div v-if="history.length === 0" class="empty-message">
      {{ $t('backup.noHistory') }}
    </div>
    <div v-else class="history-list">
      <div v-for="entry in history" :key="entry.id" class="history-item">
        <div class="history-main">
          <UiBadge :variant="statusVariant(entry.status)" dot size="sm">
            {{ $t(`backup.status_${entry.status}`) }}
          </UiBadge>
          <span class="history-date">{{ formatDate(entry.startedAt) }}</span>
          <span v-if="entry.sizeBytes" class="history-size">{{ formatSize(entry.sizeBytes) }}</span>
        </div>
        <div v-if="entry.errorMessage" class="history-error">
          {{ entry.errorMessage }}
        </div>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.empty-message {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--spacing-md) 0;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.history-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.history-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.history-size {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}

.history-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  font-family: var(--font-family-mono);
}
</style>
