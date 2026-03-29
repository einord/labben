<script setup lang="ts">
const { status, fetchStatus } = useSystemStatus()
const { t } = useI18n()

const setupGuide = computed(() => {
  if (!status.value || status.value.backupPath.mounted) return []
  return [{
    icon: 'lucide:hard-drive-download',
    title: t('backup.notMounted'),
    description: t('backup.notMountedDescription'),
    steps: [
      { text: t('backup.setupStep1'), code: 'BACKUP_PATH=/path/to/backup/destination' },
      { text: t('backup.setupStep2'), code: '- ${BACKUP_PATH}:/backups' },
      { text: t('backup.setupStep3') },
    ],
  }]
})

onMounted(() => fetchStatus())
</script>

<template>
  <div class="backup-settings">
    <UiSetupGuide v-if="setupGuide.length > 0" :guides="setupGuide" />
    <BackupConfig v-else />
  </div>
</template>

<style scoped>
.backup-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
</style>
