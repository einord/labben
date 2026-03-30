<script setup lang="ts">
interface UiAlertProps {
  /** Lucide icon name */
  icon?: string
  /** Alert title */
  title: string
  /** Optional description text */
  description?: string
  /** Visual variant */
  variant?: 'warning' | 'info' | 'danger' | 'success'
}

withDefaults(defineProps<UiAlertProps>(), {
  variant: 'warning',
})
</script>

<template>
  <div class="alert" :class="`variant-${variant}`">
    <Icon v-if="icon" :name="icon" class="alert-icon" />
    <div class="alert-text">
      <span class="alert-title">{{ title }}</span>
      <span v-if="description" class="alert-description">{{ description }}</span>
    </div>
    <div v-if="$slots.actions" class="alert-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid;
  border-radius: var(--radius-lg);
}

.variant-warning {
  background-color: var(--color-warning-bg);
  border-color: var(--color-warning);

  > .alert-icon {
    color: var(--color-warning);
  }
}

.variant-info {
  background-color: var(--color-info-bg, var(--color-accent-bg));
  border-color: var(--color-info, var(--color-accent));

  > .alert-icon {
    color: var(--color-info, var(--color-accent));
  }
}

.variant-danger {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger);

  > .alert-icon {
    color: var(--color-danger);
  }
}

.variant-success {
  background-color: var(--color-success-bg);
  border-color: var(--color-success);

  > .alert-icon {
    color: var(--color-success);
  }
}

.alert-icon {
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.alert-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.alert-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-bright);
}

.alert-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.alert-actions {
  flex-shrink: 0;
}
</style>
