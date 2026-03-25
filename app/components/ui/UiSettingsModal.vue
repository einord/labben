<script setup lang="ts">
import type { SettingsSection } from './UiSettingsModal.types'

interface UiSettingsModalProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** Modal title */
  title: string
  /** Available settings sections */
  sections: SettingsSection[]
}

const props = defineProps<UiSettingsModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const activeSection = ref(props.sections[0]?.id ?? '')

// Reset to first section when opened
watch(() => props.modelValue, (open) => {
  if (open && props.sections.length > 0) {
    activeSection.value = props.sections[0].id
  }
})

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
    <Transition name="modal">
      <div v-if="modelValue" class="settings-backdrop" @click.self="close">
        <div class="settings-dialog">
          <div class="settings-header">
            <h2 class="settings-title">{{ title }}</h2>
            <UiButton variant="ghost" size="sm" icon="lucide:x" @click="close" />
          </div>
          <div class="settings-layout">
            <nav class="settings-nav">
              <button
                v-for="section in sections"
                :key="section.id"
                class="nav-item"
                :class="{ active: activeSection === section.id }"
                @click="activeSection = section.id"
              >
                <Icon :name="section.icon" class="nav-icon" />
                <span>{{ section.label }}</span>
              </button>
            </nav>
            <div class="settings-content">
              <slot :active-section="activeSection" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.settings-dialog {
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.settings-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}

.settings-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.settings-nav {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-sm) 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  text-align: left;

  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text);
  }

  &.active {
    background-color: var(--color-accent-dim);
    color: var(--color-accent);
  }
}

.nav-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.settings-content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-normal);

  > .settings-dialog {
    transition: transform var(--transition-normal);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  > .settings-dialog {
    transform: scale(0.95);
  }
}
</style>
