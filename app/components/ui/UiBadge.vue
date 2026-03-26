<script setup lang="ts">
interface UiBadgeProps {
  /** Color variant */
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  /** Badge size */
  size?: 'sm' | 'md'
  /** Show a colored dot before text */
  dot?: boolean
}

withDefaults(defineProps<UiBadgeProps>(), {
  variant: 'neutral',
  size: 'md',
  dot: false,
})
</script>

<template>
  <span class="badge" :class="[`variant-${variant}`, `size-${size}`]">
    <span v-if="dot" class="dot" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  border-radius: 9999px;
  white-space: nowrap;
  line-height: 1;

  &.size-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }

  &.size-md {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  &.variant-success {
    background-color: var(--color-success-bg);
    color: var(--color-success);

    > .dot {
      background-color: var(--color-success);
    }
  }

  &.variant-danger {
    background-color: var(--color-danger-bg);
    color: var(--color-danger);

    > .dot {
      background-color: var(--color-danger);
    }
  }

  &.variant-warning {
    background-color: var(--color-warning-bg);
    color: var(--color-warning);

    > .dot {
      background-color: var(--color-warning);
    }
  }

  &.variant-info {
    background-color: var(--color-info-bg);
    color: var(--color-info);

    > .dot {
      background-color: var(--color-info);
    }
  }

  &.variant-neutral {
    background-color: var(--color-neutral-bg);
    color: var(--color-text-secondary);

    > .dot {
      background-color: var(--color-text-secondary);
    }
  }
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
