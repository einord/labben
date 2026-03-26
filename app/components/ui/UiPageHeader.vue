<script setup lang="ts">
interface UiPageHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle shown below title */
  subtitle?: string
}

defineProps<UiPageHeaderProps>()
</script>

<template>
  <div class="page-header">
    <div class="text">
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text-bright);
}

.subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
</style>
