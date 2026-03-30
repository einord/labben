<script setup lang="ts">
const { t } = useI18n()
const { startContainer, fetchStatus, fetchSites } = useStaticSites()

const initializing = ref(false)

async function handleInitialize() {
  if (initializing.value) return
  initializing.value = true
  const success = await startContainer()
  if (success) {
    await Promise.all([fetchStatus(), fetchSites()])
  }
  initializing.value = false
}
</script>

<template>
  <UiCard>
    <UiEmptyState
      icon="lucide:globe"
      :title="t('staticSites.setup.title')"
      :description="t('staticSites.setup.description')"
    >
      <template #actions>
        <UiButton
          variant="primary"
          icon="lucide:play"
          :loading="initializing"
          @click="handleInitialize"
        >
          {{ initializing ? t('staticSites.setup.initializing') : t('staticSites.setup.initialize') }}
        </UiButton>
      </template>
    </UiEmptyState>
  </UiCard>
</template>
