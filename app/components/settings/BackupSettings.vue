<script setup lang="ts">
const { status, fetchStatus } = useSystemStatus()

onMounted(() => fetchStatus())
</script>

<template>
  <div class="backup-settings">
    <div v-if="status && !status.backupPath.mounted" class="setup-required">
      <UiEmptyState
        icon="lucide:hard-drive-download"
        :title="$t('backup.notMounted')"
        :description="$t('backup.notMountedDescription')"
      />
      <div class="setup-instructions">
        <p class="instruction-text">{{ $t('backup.setupStep1') }}</p>
        <code class="code-block">BACKUP_PATH=/path/to/backup/destination</code>
        <p class="instruction-text">{{ $t('backup.setupStep2') }}</p>
        <code class="code-block">- ${BACKUP_PATH}:/backups</code>
        <p class="instruction-text">{{ $t('backup.setupStep3') }}</p>
      </div>
    </div>
    <BackupConfig v-else />
  </div>
</template>

<style scoped>
.backup-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setup-required {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setup-instructions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.instruction-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.code-block {
  display: block;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  background-color: var(--color-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}
</style>
