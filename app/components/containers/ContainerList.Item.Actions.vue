<script setup lang="ts">
import type { ContainerStatus } from '~/types/docker'

interface ContainerListItemActionsProps {
  /** Current container status */
  status: ContainerStatus
  /** Whether an action is currently in progress */
  loading: boolean
  /** Whether destructive actions (stop, restart) should be hidden */
  disableDestructive?: boolean
}

const props = defineProps<ContainerListItemActionsProps>()

defineEmits<{
  start: []
  stop: []
  restart: []
}>()

const isRunning = computed(() => props.status === 'running')
const isStopped = computed(() =>
  props.status === 'exited' || props.status === 'dead' || props.status === 'created',
)
</script>

<template>
  <div class="actions">
    <UiButton
      v-if="isStopped"
      variant="ghost"
      size="sm"
      icon="lucide:play"
      :loading="loading"
      @click="$emit('start')"
    />
    <UiButton
      v-if="isRunning && !disableDestructive"
      variant="ghost"
      size="sm"
      icon="lucide:square"
      :loading="loading"
      @click="$emit('stop')"
    />
    <UiButton
      v-if="isRunning && !disableDestructive"
      variant="ghost"
      size="sm"
      icon="lucide:refresh-cw"
      :loading="loading"
      @click="$emit('restart')"
    />
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
</style>
