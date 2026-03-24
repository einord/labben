export function useLogStream(containerId: Ref<string> | string) {
  const logs = ref<string[]>([])
  const connected = ref(false)
  const maxLines = 1000

  const resolvedId = computed(() => typeof containerId === 'string' ? containerId : containerId.value)

  let ws: WebSocket | null = null

  /** Connect to the WebSocket log stream */
  function connect() {
    if (ws) disconnect()

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/api/containers/${resolvedId.value}/logs-stream`

    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
    }

    ws.onmessage = (event: MessageEvent) => {
      const message = String(event.data)
      logs.value.push(message)

      // Trim to max lines
      if (logs.value.length > maxLines) {
        logs.value = logs.value.slice(-maxLines)
      }
    }

    ws.onclose = () => {
      connected.value = false
      ws = null
    }

    ws.onerror = () => {
      connected.value = false
      ws?.close()
      ws = null
    }
  }

  /** Disconnect from the WebSocket log stream */
  function disconnect() {
    if (ws) {
      ws.close()
      ws = null
    }
    connected.value = false
  }

  /** Clear all stored log lines */
  function clear() {
    logs.value = []
  }

  onUnmounted(() => disconnect())

  return { logs, connected, connect, disconnect, clear }
}
