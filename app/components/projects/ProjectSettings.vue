<script setup lang="ts">
import type { SettingsSection } from '~/components/ui/UiSettingsModal.types'

interface ProjectSettingsProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** The project to show settings for */
  projectName: string
}

const props = defineProps<ProjectSettingsProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const { getConfig, saveConfig } = useProjects()

const composeContent = ref('')
const loadingConfig = ref(false)

const sections = computed<SettingsSection[]>(() => [
  { id: 'compose', label: t('projectSettings.compose'), icon: 'lucide:file-code' },
  { id: 'general', label: t('projectSettings.general'), icon: 'lucide:settings' },
])

/** Load compose config when modal opens */
watch(() => props.modelValue, async (open) => {
  if (open && props.projectName) {
    loadingConfig.value = true
    composeContent.value = await getConfig(props.projectName)
    loadingConfig.value = false
  }
})

async function handleSave() {
  await saveConfig(props.projectName, composeContent.value)
}
</script>

<template>
  <UiSettingsModal
    :model-value="modelValue"
    :title="t('projectSettings.title', { name: projectName })"
    :sections="sections"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #default="{ activeSection }">
      <div v-if="activeSection === 'compose'" class="compose-section">
        <div v-if="loadingConfig" class="loading-wrapper">
          <UiSpinner size="md" />
        </div>
        <template v-else>
          <UiComposeEditor
            v-model="composeContent"
            @save="handleSave"
          />
        </template>
      </div>

      <div v-if="activeSection === 'general'" class="general-section">
        <UiEmptyState
          icon="lucide:construction"
          :title="$t('projectSettings.comingSoon')"
          :description="$t('projectSettings.generalDescription')"
        />
      </div>
    </template>
  </UiSettingsModal>
</template>

<style scoped>
.compose-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.general-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
