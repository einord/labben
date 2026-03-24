<script setup lang="ts">
interface UiButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Optional Lucide icon name shown before text */
  icon?: string
  /** Show loading spinner and disable the button */
  loading?: boolean
  /** Disable interaction */
  disabled?: boolean
}

withDefaults(defineProps<UiButtonProps>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    class="button"
    :class="[`variant-${variant}`, `size-${size}`]"
    :disabled="disabled || loading"
  >
    <Icon
      v-if="loading"
      name="lucide:loader-2"
      class="spinner"
    />
    <Icon
      v-else-if="icon"
      :name="icon"
      class="icon"
    />
    <span v-if="$slots.default" class="label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  font-family: inherit;
  line-height: 1;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Sizes */
  &.size-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  &.size-md {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-md);
  }

  &.size-lg {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
  }

  /* Variants */
  &.variant-primary {
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
    border-color: var(--color-accent);

    &:hover:not(:disabled) {
      box-shadow: 0 0 12px var(--color-accent-glow);
    }
  }

  &.variant-secondary {
    background-color: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-border);

    &:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
      border-color: var(--color-accent);
      color: var(--color-text-bright);
    }
  }

  &.variant-danger {
    background-color: var(--color-danger);
    color: var(--color-text-on-danger);
    border-color: var(--color-danger);

    &:hover:not(:disabled) {
      box-shadow: 0 0 12px var(--color-danger-glow);
    }
  }

  &.variant-ghost {
    background-color: transparent;
    color: var(--color-text-secondary);
    border-color: transparent;

    &:hover:not(:disabled) {
      background-color: var(--color-surface);
      color: var(--color-text-bright);
    }
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

.icon {
  font-size: 1.1em;
}
</style>
