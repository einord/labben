<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="proxy-settings">
    <div class="setting-group">
      <h3 class="section-title">{{ $t('proxy.title') }}</h3>
      <ProxySetup />
    </div>
    <ProxyCredentials />
    <ProxyBaseDomain />
  </div>
</template>

<style scoped>
.proxy-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}
</style>
