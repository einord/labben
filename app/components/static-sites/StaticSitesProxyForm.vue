<script setup lang="ts">
import type { StaticSite } from '~/types/static-sites'

interface StaticSitesProxyFormProps {
  modelValue: boolean
  site?: StaticSite | null
}

const props = withDefaults(defineProps<StaticSitesProxyFormProps>(), {
  site: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const { createProxyHost, fetchProxyHosts } = useNpm()

const enableSsl = ref(true)
const saving = ref(false)

watch(() => props.modelValue, (open) => {
  if (open) {
    enableSsl.value = true
  }
})

async function handlePublish() {
  if (!props.site || saving.value) return

  saving.value = true
  const success = await createProxyHost({
    domainNames: [props.site.domain],
    forwardScheme: 'http',
    forwardHost: 'static-sites',
    forwardPort: 80,
    sslForced: enableSsl.value,
    allowWebsocketUpgrade: false,
    blockExploits: true,
    http2Support: true,
    meta: enableSsl.value
      ? { letsencrypt_agree: true, dns_challenge: false }
      : {},
  })
  saving.value = false

  if (success) {
    await fetchProxyHosts()
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
    :title="t('staticSites.publishTitle')"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="form">
      <p class="description">
        {{ t('staticSites.publishDescription', { domain: site?.domain ?? '' }) }}
      </p>

      <label class="checkbox-label">
        <input v-model="enableSsl" type="checkbox" />
        <span>{{ t('staticSites.enableSsl') }}</span>
      </label>
      <p class="ssl-hint">{{ t('staticSites.sslHint') }}</p>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="close">{{ t('common.cancel') }}</UiButton>
      <UiButton
        variant="primary"
        icon="lucide:globe"
        :loading="saving"
        @click="handlePublish"
      >
        {{ t('staticSites.publish') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
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

.ssl-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  margin: 0;
}
</style>
