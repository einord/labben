<script setup lang="ts">
</script>

<template>
  <div>
    <UiPageHeader
      :title="$t('nav.backup')"
      :subtitle="$t('backup.subtitle')"
    />
    <div class="backup-content">
      <BackupStatus />
      <BackupHistory />
    </div>
  </div>
</template>

<style scoped>
.backup-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
</style>
