<script setup lang="ts">
interface UiModalProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** Modal title shown in header */
  title: string
  /** Width variant */
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<UiModalProps>(), {
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="overlay" @click.self="close">
        <div class="dialog" :class="`size-${size}`">
          <div class="header">
            <h2 class="title">{{ title }}</h2>
            <button class="close-button" @click="close">
              <Icon name="lucide:x" />
            </button>
          </div>
          <div class="body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.dialog {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;

  &.size-sm {
    max-width: 400px;
  }

  &.size-md {
    max-width: 560px;
  }

  &.size-lg {
    max-width: 720px;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text-bright);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    color: var(--color-text-bright);
    background-color: var(--color-surface-hover);
  }
}

.body {
  padding: var(--spacing-lg);
  overflow-y: auto;
  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: 1.6;
}

.footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-normal);

  > .dialog {
    transition: transform var(--transition-normal);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  > .dialog {
    transform: scale(0.95);
  }
}
</style>
