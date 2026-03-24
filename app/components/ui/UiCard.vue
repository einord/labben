<script setup lang="ts">
interface UiCardProps {
  /** Adds hover effect with translateY, shadow, and border glow */
  hoverable?: boolean
  /** Wraps card in NuxtLink if provided */
  to?: string
}

withDefaults(defineProps<UiCardProps>(), {
  hoverable: false,
})
</script>

<template>
  <NuxtLink v-if="to" :to="to" class="card" :class="{ hoverable }">
    <div v-if="$slots.icon" class="icon-area">
      <slot name="icon" />
    </div>
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </NuxtLink>
  <div v-else class="card" :class="{ hoverable }">
    <div v-if="$slots.icon" class="icon-area">
      <slot name="icon" />
    </div>
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  &.hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-accent);
    }
  }
}

.icon-area {
  font-size: var(--icon-size-lg);
  color: var(--color-accent);
}

.header {
  font-weight: 600;
  color: var(--color-text-bright);
  font-size: 1.1rem;
}

.body {
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.footer {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
}
</style>
