<script setup lang="ts">
import { formatContainerName } from '~/utils/docker'

interface ProjectContainerDrawerProps {
  /** Container ID to show, or null if closed */
  containerId: string | null
}

const props = defineProps<ProjectContainerDrawerProps>()

const emit = defineEmits<{
  close: []
}>()

const isOpen = computed(() => props.containerId !== null)

const resolvedId = computed(() => props.containerId ?? '')

const { container, loading, fetchDetail } = useContainerDetail(resolvedId)

const displayName = computed(() => {
  if (!container.value) return 'Container'
  return formatContainerName(container.value.name)
})

/** Fetch container details when drawer opens */
watch(() => props.containerId, async (id) => {
  if (id) {
    await fetchDetail()
  }
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <UiDrawer
    :model-value="isOpen"
    :title="displayName"
    width="lg"
    @update:model-value="!$event && handleClose()"
  >
    <template #header-actions>
      <UiButton
        variant="ghost"
        size="sm"
        icon="lucide:refresh-cw"
        :loading="loading"
        @click="fetchDetail"
      />
    </template>

    <div v-if="containerId" class="drawer-content">
      <div v-if="loading && !container" class="loading-wrapper">
        <UiSpinner size="lg" />
      </div>
      <template v-else-if="container">
        <ContainerDetail :container="container" />
        <div class="logs-section">
          <h3 class="section-title">Loggar</h3>
          <ContainerDetailLogs :container-id="containerId" />
        </div>
      </template>
    </div>
  </UiDrawer>
</template>

<style scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.logs-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}
</style>
