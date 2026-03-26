<script setup lang="ts">
const { baseDomain, fetchBaseDomain, setBaseDomain } = useNpm()

const domainInput = ref('')
const saving = ref(false)

async function handleSave() {
  if (!domainInput.value.trim()) return
  saving.value = true
  await setBaseDomain(domainInput.value.trim())
  saving.value = false
}

onMounted(async () => {
  await fetchBaseDomain()
  domainInput.value = baseDomain.value ?? ''
})
</script>

<template>
  <UiCard>
    <template #header>{{ $t('baseDomain.title') }}</template>
    <div class="domain-form">
      <p class="description">
        {{ $t('baseDomain.description') }} <code>projektnamn.{{ domainInput || 'example.com' }}</code>
      </p>
      <div class="input-row">
        <UiInput
          v-model="domainInput"
          placeholder="homelab.local"
        />
        <UiButton
          variant="primary"
          size="sm"
          :loading="saving"
          :disabled="!domainInput.trim()"
          @click="handleSave"
        >
          {{ $t('common.save') }}
        </UiButton>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
.domain-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;

  > code {
    font-family: var(--font-family-mono);
    color: var(--color-accent);
    font-size: var(--font-size-xs);
  }
}

.input-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;

  > :first-child {
    flex: 1;
  }
}
</style>
