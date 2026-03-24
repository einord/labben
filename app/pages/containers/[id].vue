<script setup lang="ts">
import { formatContainerName } from '~/utils/docker'

const route = useRoute()
const containerId = computed(() => String(route.params.id))

const { container, loading, fetchDetail } = useContainerDetail(containerId)

const displayName = computed(() => {
  if (!container.value) return 'Container'
  return formatContainerName(container.value.name)
})

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div>
    <UiPageHeader :title="displayName">
      <template #actions>
        <UiButton
          variant="ghost"
          size="sm"
          icon="lucide:arrow-left"
          @click="navigateTo('/containers')"
        >
          Tillbaka
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:refresh-cw"
          :loading="loading"
          @click="fetchDetail"
        >
          Uppdatera
        </UiButton>
      </template>
    </UiPageHeader>

    <div v-if="loading && !container" class="loading-wrapper">
      <UiSpinner size="lg" />
    </div>

    <template v-else-if="container">
      <ContainerDetail :container="container" />
      <div class="logs-section">
        <UiPageHeader title="Loggar" />
        <ContainerDetailLogs />
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.logs-section {
  margin-top: var(--spacing-xl);
}

</style>
