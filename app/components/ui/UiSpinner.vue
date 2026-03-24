<script setup lang="ts">
interface UiSpinnerProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<UiSpinnerProps>(), {
  size: 'md',
})
</script>

<template>
  <Icon
    name="lucide:loader-2"
    class="spinner"
    :class="`size-${size}`"
  />
</template>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
  color: var(--color-accent);

  &.size-sm {
    font-size: 1rem;
  }

  &.size-md {
    font-size: 1.5rem;
  }

  &.size-lg {
    font-size: 2rem;
  }
}
</style>
