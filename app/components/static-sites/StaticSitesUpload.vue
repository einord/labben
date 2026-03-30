<script setup lang="ts">
import type { StaticSite } from '~/types/static-sites'

interface StaticSitesUploadProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** The site to upload files to */
  site?: StaticSite | null
}

const props = withDefaults(defineProps<StaticSitesUploadProps>(), {
  site: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const { uploadArchive, getSitePath } = useStaticSites()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const sitePath = ref<string | null>(null)

watch(() => props.modelValue, async (open) => {
  if (open && props.site) {
    selectedFile.value = null
    sitePath.value = await getSitePath(props.site.id)
  }
})

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    selectedFile.value = file
  }
}

async function handleUpload() {
  if (!selectedFile.value || !props.site || uploading.value) return

  uploading.value = true
  const success = await uploadArchive(props.site.id, selectedFile.value)
  uploading.value = false

  if (success) {
    selectedFile.value = null
    emit('update:modelValue', false)
  }
}

async function handleCopyPath() {
  if (sitePath.value) {
    await navigator.clipboard.writeText(sitePath.value)
    toast.success(t('staticSites.pathCopied'))
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <UiDrawer
    :model-value="modelValue"
    :title="t('staticSites.uploadTitle')"
    width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="upload-content">
      <p class="upload-description">{{ t('staticSites.uploadDescription') }}</p>

      <div class="file-input-wrapper">
        <input
          ref="fileInput"
          type="file"
          accept=".zip,.tar.gz,.tgz"
          class="file-input"
          @change="handleFileChange"
        />
      </div>

      <div v-if="selectedFile" class="selected-file">
        <Icon name="lucide:file-archive" class="file-icon" />
        <span class="file-name">{{ selectedFile.name }}</span>
        <span class="file-size">{{ (selectedFile.size / 1024).toFixed(1) }} KB</span>
      </div>

      <UiButton
        variant="primary"
        icon="lucide:upload"
        :disabled="!selectedFile"
        :loading="uploading"
        @click="handleUpload"
      >
        {{ t('staticSites.uploadTitle') }}
      </UiButton>

      <!-- Manual file path section -->
      <div v-if="sitePath" class="path-section">
        <p class="path-description">{{ t('staticSites.filePathDescription') }}</p>
        <div class="path-row">
          <code class="path-code">{{ sitePath }}</code>
          <UiButton variant="ghost" size="sm" icon="lucide:copy" @click="handleCopyPath">
            {{ t('staticSites.copyPath') }}
          </UiButton>
        </div>
      </div>
    </div>
  </UiDrawer>
</template>

<style scoped>
.upload-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.upload-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.file-input-wrapper {
  display: flex;
}

.file-input {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.file-input::file-selector-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  margin-right: var(--spacing-md);
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-neutral-bg);
  }
}

.selected-file {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface-hover);
  border-radius: var(--radius-md);
}

.file-icon {
  color: var(--color-accent);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.file-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-left: auto;
}

.path-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.path-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.path-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.path-code {
  flex: 1;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  background-color: var(--color-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
