<script setup lang="ts">
interface ProjectCreateModalProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
}

defineProps<ProjectCreateModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

const DEFAULT_TEMPLATE = `services:
  app:
    image: nginx:alpine
    ports:
      - "8080:80"
    restart: unless-stopped
`

const { createProject } = useProjects()

const projectName = ref('')
const composeContent = ref(DEFAULT_TEMPLATE)
const creating = ref(false)

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

const nameError = computed(() => {
  const name = projectName.value.trim()
  if (!name) return ''
  if (!NAME_PATTERN.test(name)) return 'Namn får bara innehålla bokstäver, siffror, bindestreck och understreck'
  return ''
})

const isValid = computed(() => {
  const name = projectName.value.trim()
  return name.length > 0 && !nameError.value
})

async function handleCreate() {
  if (!isValid.value || creating.value) return

  creating.value = true
  const success = await createProject(projectName.value.trim(), composeContent.value)
  creating.value = false

  if (success) {
    emit('created')
    close()
    resetForm()
  }
}

function close() {
  emit('update:modelValue', false)
}

function resetForm() {
  projectName.value = ''
  composeContent.value = DEFAULT_TEMPLATE
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Nytt projekt"
    size="lg"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="form">
      <UiInput
        v-model="projectName"
        label="Projektnamn"
        placeholder="mitt-projekt"
        :error="nameError"
      />
      <div class="editor-section">
        <label class="editor-label">docker-compose.yml</label>
        <UiComposeEditor
          v-model="composeContent"
        />
      </div>
    </div>
    <template #footer>
      <UiButton variant="ghost" @click="close">
        Avbryt
      </UiButton>
      <UiButton
        variant="primary"
        icon="lucide:plus"
        :disabled="!isValid"
        :loading="creating"
        @click="handleCreate"
      >
        Skapa
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.editor-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
