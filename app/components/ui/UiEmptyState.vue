<script setup lang="ts">
interface UiEmptyStateProps {
  /** Lucide icon name displayed prominently */
  icon: string
  /** Heading text */
  title: string
  /** Optional description text */
  description?: string
}

defineProps<UiEmptyStateProps>()
</script>

<template>
  <div class="empty-state">
    <Icon :name="icon" class="icon" />
    <h3 class="title">{{ title }}</h3>
    <p v-if="description" class="description">{{ description }}</p>
    <div v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  gap: var(--spacing-sm);
}

.icon {
  font-size: 3rem;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-bright);
}

.description {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  max-width: 360px;
  line-height: 1.5;
}

.actions {
  margin-top: var(--spacing-md);
  display: flex;
  gap: var(--spacing-sm);
}
</style>
