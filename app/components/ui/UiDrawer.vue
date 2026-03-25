<script setup lang="ts">
interface UiDrawerProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** Title shown in the drawer header */
  title: string
  /** Drawer width preset */
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<UiDrawerProps>(), {
  width: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const widthMap: Record<string, string> = {
  sm: '360px',
  md: '480px',
  lg: '560px',
  xl: '720px',
}

const drawerWidth = computed(() => widthMap[props.width])

function close() {
  emit('update:modelValue', false)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue" class="drawer-backdrop" @click.self="close">
        <aside class="drawer-panel" :style="{ width: drawerWidth }">
          <div class="drawer-header">
            <h2 class="drawer-title">{{ title }}</h2>
            <div class="drawer-header-actions">
              <slot name="header-actions" />
              <UiButton variant="ghost" size="sm" icon="lucide:x" @click="close" />
            </div>
          </div>
          <div class="drawer-body">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  background-color: var(--color-overlay);
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  height: 100%;
  max-width: 90vw;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.drawer-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

/* Transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--transition-normal);

  > .drawer-panel {
    transition: transform var(--transition-normal);
  }
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;

  > .drawer-panel {
    transform: translateX(100%);
  }
}
</style>
