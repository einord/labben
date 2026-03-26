<script setup lang="ts">
import type { CreateProxyHostData, NpmProxyHost } from '~/types/npm'

interface ProxyHostFormProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** Existing host to edit (null = create new) */
  editHost?: NpmProxyHost | null
  /** Suggested domain name */
  suggestedDomain?: string
  /** Suggested forward host */
  suggestedHost?: string
  /** Suggested forward port */
  suggestedPort?: number
  /** Project name for meta tagging */
  projectName?: string
}

const props = withDefaults(defineProps<ProxyHostFormProps>(), {
  editHost: null,
  suggestedDomain: '',
  suggestedHost: 'host.docker.internal',
  suggestedPort: 0,
  projectName: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { t } = useI18n()
const { createProxyHost, updateProxyHost } = useNpm()

const domain = ref('')
const forwardHost = ref('host.docker.internal')
const forwardPort = ref(80)
const forwardScheme = ref<'http' | 'https'>('http')
const sslForced = ref(false)
const websocket = ref(true)
const blockExploits = ref(true)
const http2 = ref(true)
const saving = ref(false)

const isEditing = computed(() => props.editHost !== null)
const title = computed(() => isEditing.value ? t('proxyHosts.editHost') : t('proxyHosts.newHost'))

const isValid = computed(() => {
  return domain.value.trim().length > 0
    && forwardHost.value.trim().length > 0
    && forwardPort.value > 0
})

/** Initialize form with edit data or suggestions */
function initForm() {
  if (props.editHost) {
    domain.value = props.editHost.domainNames[0] ?? ''
    forwardHost.value = props.editHost.forwardHost
    forwardPort.value = props.editHost.forwardPort
    forwardScheme.value = props.editHost.forwardScheme as 'http' | 'https'
    sslForced.value = props.editHost.sslForced
  } else {
    domain.value = props.suggestedDomain
    forwardHost.value = props.suggestedHost
    forwardPort.value = props.suggestedPort || 80
    forwardScheme.value = 'http'
    sslForced.value = false
  }
  websocket.value = true
  blockExploits.value = true
  http2.value = true
}

watch(() => props.modelValue, (open) => {
  if (open) initForm()
})

async function handleSave() {
  if (!isValid.value || saving.value) return

  const data: CreateProxyHostData = {
    domainNames: [domain.value.trim()],
    forwardScheme: forwardScheme.value,
    forwardHost: forwardHost.value.trim(),
    forwardPort: forwardPort.value,
    sslForced: sslForced.value,
    allowWebsocketUpgrade: websocket.value,
    blockExploits: blockExploits.value,
    http2Support: http2.value,
    meta: props.projectName ? { labben_project: props.projectName } : {},
  }

  saving.value = true
  let success: boolean

  if (isEditing.value && props.editHost) {
    success = await updateProxyHost(props.editHost.id, data)
  } else {
    success = await createProxyHost(data)
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
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="form">
      <UiInput
        v-model="domain"
        :label="$t('proxyHosts.domainName')"
        placeholder="app.example.com"
      />

      <div class="forward-row">
        <div class="scheme-select">
          <label class="field-label">{{ $t('proxyHosts.protocol') }}</label>
          <select v-model="forwardScheme" class="select-input">
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
          </select>
        </div>
        <UiInput
          v-model="forwardHost"
          :label="$t('proxyHosts.forwardHost')"
          placeholder="host.docker.internal"
        />
        <div class="port-field">
          <label class="field-label">{{ $t('proxyHosts.port') }}</label>
          <input
            v-model.number="forwardPort"
            type="number"
            min="1"
            max="65535"
            class="port-input"
          />
        </div>
      </div>

      <div class="options">
        <label class="checkbox-label">
          <input v-model="sslForced" type="checkbox" />
          <span>{{ $t('proxyHosts.forceSSL') }}</span>
        </label>
        <label class="checkbox-label">
          <input v-model="websocket" type="checkbox" />
          <span>{{ $t('proxyHosts.websocketSupport') }}</span>
        </label>
        <label class="checkbox-label">
          <input v-model="blockExploits" type="checkbox" />
          <span>{{ $t('proxyHosts.blockExploits') }}</span>
        </label>
        <label class="checkbox-label">
          <input v-model="http2" type="checkbox" />
          <span>HTTP/2</span>
        </label>
      </div>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="close">{{ $t('common.cancel') }}</UiButton>
      <UiButton
        variant="primary"
        :disabled="!isValid"
        :loading="saving"
        @click="handleSave"
      >
        {{ isEditing ? $t('proxyHosts.update') : $t('common.create') }}
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

.forward-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;

  > :nth-child(2) {
    flex: 1;
  }
}

.scheme-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.select-input {
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-dim);
  }
}

.port-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100px;
}

.port-input {
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-dim);
  }
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
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
