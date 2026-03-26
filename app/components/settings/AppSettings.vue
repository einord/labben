<script setup lang="ts">
import type { SettingsSection } from '~/components/ui/UiSettingsModal.types'
import type { ThemeMode } from '~/composables/useTheme'

interface AppSettingsProps {
  modelValue: boolean
}

defineProps<AppSettingsProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { config, getPalettes, setPalette, setMode } = useTheme()

const sections: SettingsSection[] = [
  { id: 'appearance', label: 'Utseende', icon: 'lucide:palette' },
  { id: 'about', label: 'Om Labben', icon: 'lucide:info' },
]

const modes: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'Ljust', icon: 'lucide:sun' },
  { value: 'dark', label: 'Mörkt', icon: 'lucide:moon' },
  { value: 'auto', label: 'Auto', icon: 'lucide:monitor' },
]

const palettes = getPalettes()
</script>

<template>
  <UiSettingsModal
    :model-value="modelValue"
    title="Inställningar"
    :sections="sections"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #default="{ activeSection }">
      <div v-if="activeSection === 'appearance'" class="appearance-section">
        <div class="setting-group">
          <h3 class="section-title">Läge</h3>
          <div class="mode-options">
            <button
              v-for="m in modes"
              :key="m.value"
              class="mode-option"
              :class="{ active: config.mode === m.value }"
              @click="setMode(m.value)"
            >
              <Icon :name="m.icon" class="mode-icon" />
              <span class="mode-label">{{ m.label }}</span>
            </button>
          </div>
        </div>

        <div class="setting-group">
          <h3 class="section-title">Tema</h3>
          <div class="palette-options">
            <button
              v-for="p in palettes"
              :key="p.id"
              class="palette-option"
              :class="{ active: config.palette === p.id }"
              @click="setPalette(p.id)"
            >
              <span class="palette-label">{{ p.label }}</span>
              <span class="palette-description">{{ p.description }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeSection === 'about'" class="about-section">
        <h3 class="section-title">Om Labben</h3>
        <p class="about-text">
          Labben är ett verktyg för att hantera Docker-projekt, containrar och proxykonfiguration i ditt homelab.
        </p>
      </div>
    </template>
  </UiSettingsModal>
</template>

<style scoped>
.appearance-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}

.palette-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.palette-option {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  color: var(--color-text);

  &:hover {
    border-color: var(--color-text-muted);
    background-color: var(--color-surface-hover);
  }

  &.active {
    border-color: var(--color-accent);
  }
}

.palette-label {
  font-weight: 600;
  font-size: var(--font-size-md);
}

.palette-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.mode-options {
  display: flex;
  gap: var(--spacing-md);
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  color: var(--color-text-secondary);

  &:hover {
    border-color: var(--color-text-muted);
    background-color: var(--color-surface-hover);
  }

  &.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.mode-icon {
  font-size: var(--font-size-2xl);
}

.mode-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.about-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.6;
  margin: 0;
}
</style>
