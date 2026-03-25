<script setup lang="ts">
</script>

<template>
  <div>
    <UiPageHeader
      title="Proxy Manager"
      subtitle="Hantera Nginx Proxy Manager för dina projekt."
    />
    <div class="proxy-content">
      <ProxySetup />
      <ProxyCredentials />
      <ProxyHosts />
    </div>
  </div>
</template>

<style scoped>
.proxy-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
</style>
