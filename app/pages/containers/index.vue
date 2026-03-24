<script setup lang="ts">
const { containers, loading, fetchContainers, startContainer, stopContainer, restartContainer } = useContainers()

async function handleStart(id: string) {
  await startContainer(id)
  await fetchContainers()
}

async function handleStop(id: string) {
  await stopContainer(id)
  await fetchContainers()
}

async function handleRestart(id: string) {
  await restartContainer(id)
  await fetchContainers()
}

onMounted(() => {
  fetchContainers()
})
</script>

<template>
  <div>
    <UiPageHeader title="Containrar">
      <template #actions>
        <UiButton
          variant="secondary"
          size="sm"
          icon="lucide:refresh-cw"
          :loading="loading"
          @click="fetchContainers"
        >
          Uppdatera
        </UiButton>
      </template>
    </UiPageHeader>
    <ContainerList
      :containers="containers"
      :loading="loading"
      @start="handleStart"
      @stop="handleStop"
      @restart="handleRestart"
    />
  </div>
</template>
