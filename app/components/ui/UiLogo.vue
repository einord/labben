<script setup lang="ts">
interface UiLogoProps {
  /** Size of the logo icon */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the app name next to the icon */
  showText?: boolean
}

withDefaults(defineProps<UiLogoProps>(), {
  size: 'md',
  showText: true,
})
</script>

<template>
  <div class="logo" :class="`size-${size}`">
    <img src="~/assets/logo.svg" alt="Labben" class="logo-icon" />
    <span v-if="showText" class="logo-text">Labben</span>
  </div>
</template>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.02em;
}

.size-sm > .logo-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.size-sm > .logo-text {
  font-size: var(--font-size-lg);
}

.size-md > .logo-icon {
  width: 2rem;
  height: 2rem;
}

.size-md > .logo-text {
  font-size: var(--font-size-2xl);
}

.size-lg > .logo-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.size-lg > .logo-text {
  font-size: var(--font-size-3xl);
}
</style>
