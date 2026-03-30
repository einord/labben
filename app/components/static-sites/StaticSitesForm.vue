<script setup lang="ts">
import type { StaticSite } from '~/types/static-sites'

interface StaticSitesFormProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** Existing site to edit (null = create new) */
  editSite?: StaticSite | null
}

const props = withDefaults(defineProps<StaticSitesFormProps>(), {
  editSite: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { t } = useI18n()
const { createSite, updateSite } = useStaticSites()

const domain = ref('')
const enabled = ref(true)
const saving = ref(false)

const isEditing = computed(() => props.editSite !== null)
const title = computed(() => isEditing.value ? t('staticSites.editTitle') : t('staticSites.createTitle'))
const isValid = computed(() => domain.value.trim().length > 0)

/** Initialize form with edit data or defaults */
function initForm() {
  if (props.editSite) {
    domain.value = props.editSite.domain
    enabled.value = props.editSite.enabled
  } else {
    domain.value = ''
    enabled.value = true
  }
}

watch(() => props.modelValue, (open) => {
  if (open) initForm()
})

async function handleSave() {
  if (!isValid.value || saving.value) return

  saving.value = true
  let success: boolean

  if (isEditing.value && props.editSite) {
    success = await updateSite(props.editSite.id, {
      domain: domain.value.trim(),
      enabled: enabled.value,
    })
  } else {
    success = await createSite(domain.value.trim())
  }

  saving.value = false

  if (success) {
    emit('saved')
    emit('update:modelValue', false)
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="title"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="form">
      <UiInput
        v-model="domain"
        :label="t('staticSites.domain')"
        :placeholder="t('staticSites.domainPlaceholder')"
      />

      <label v-if="isEditing" class="checkbox-label">
        <input v-model="enabled" type="checkbox" />
        <span>{{ t('staticSites.enabled') }}</span>
      </label>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="close">{{ t('common.cancel') }}</UiButton>
      <UiButton
        variant="primary"
        :disabled="!isValid"
        :loading="saving"
        @click="handleSave"
      >
        {{ isEditing ? t('common.update') : t('common.create') }}
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;

  > input {
    accent-color: var(--color-accent);
  }
}
</style>
