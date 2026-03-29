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

const expandedErrors = ref<Set<string>>(new Set())

function toggleError(id: string) {
  if (expandedErrors.value.has(id)) {
    expandedErrors.value.delete(id)
  } else {
    expandedErrors.value.add(id)
  }
}

function truncateError(message: string): string {
  const firstLine = message.split('\n')[0] ?? message
  return firstLine.length > 100 ? firstLine.slice(0, 100) + '...' : firstLine
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
        <div v-if="entry.errorMessage" class="history-error" @click="toggleError(entry.id)">
          <div class="error-header">
            <Icon :name="expandedErrors.has(entry.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="error-toggle" />
            <span class="error-preview">{{ truncateError(entry.errorMessage) }}</span>
          </div>
          <pre v-if="expandedErrors.has(entry.id)" class="error-details">{{ entry.errorMessage }}</pre>
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
  cursor: pointer;
}

.error-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.error-toggle {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  flex-shrink: 0;
}

.error-preview {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.error-details {
  margin: var(--spacing-xs) 0 0 0;
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.4;
}
</style>
