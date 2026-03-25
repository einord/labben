<script setup lang="ts">
interface ContainerDetailLogsProps {
  /** The container ID to display logs for */
  containerId: string
}

const props = defineProps<ContainerDetailLogsProps>()

const resolvedId = computed(() => props.containerId)

const { logs: streamLogs, connected, connect, disconnect, clear } = useLogStream(resolvedId)
const { logs: initialLogs, fetchLogs } = useContainerDetail(resolvedId)

const logContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const tailCount = ref(100)

const displayedLogs = computed(() => {
  if (connected.value) {
    return streamLogs.value.join('\n')
  }
  return initialLogs.value
})

/** Track whether the user has scrolled up to pause auto-scroll */
function handleScroll() {
  if (!logContainer.value) return
  const el = logContainer.value
  const threshold = 50
  autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

/** Scroll to the bottom of the log container */
function scrollToBottom() {
  if (!logContainer.value) return
  logContainer.value.scrollTop = logContainer.value.scrollHeight
}

/** Toggle live log streaming on/off */
function toggleLive() {
  if (connected.value) {
    disconnect()
  } else {
    connect()
  }
}

/** Load more historical logs */
async function loadMore() {
  tailCount.value += 200
  await fetchLogs(tailCount.value)
}

// Auto-scroll when new logs arrive
watch(displayedLogs, () => {
  if (autoScroll.value) {
    nextTick(() => scrollToBottom())
  }
})

// Fetch initial logs on mount
onMounted(async () => {
  await fetchLogs(tailCount.value)
  nextTick(() => scrollToBottom())
})
</script>

<template>
  <div class="logs-panel">
    <div class="toolbar">
      <UiButton
        :variant="connected ? 'primary' : 'secondary'"
        size="sm"
        :icon="connected ? 'lucide:radio' : 'lucide:circle'"
        @click="toggleLive"
      >
        {{ connected ? 'Live' : 'Anslut' }}
      </UiButton>
      <UiButton
        variant="ghost"
        size="sm"
        icon="lucide:trash-2"
        @click="clear"
      >
        Rensa
      </UiButton>
      <UiButton
        v-if="!connected"
        variant="ghost"
        size="sm"
        icon="lucide:chevrons-up"
        @click="loadMore"
      >
        Ladda fler
      </UiButton>
    </div>
    <div
      ref="logContainer"
      class="log-output"
      @scroll="handleScroll"
    >
      <pre><code>{{ displayedLogs || 'Inga loggar att visa.' }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.logs-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.log-output {
  background-color: var(--color-code-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;

  > pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;

    > code {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
      line-height: 1.6;
      color: var(--color-text-secondary);
    }
  }
}
</style>
