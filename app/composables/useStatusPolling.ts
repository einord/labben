import type { ContainerStatusInfo } from '~/types/docker'

const POLL_INTERVAL_MS = 10_000

interface StatusPollingOptions {
  /** Called with fresh container statuses on each poll tick */
  onUpdate: (statuses: ContainerStatusInfo[]) => void
}

/**
 * Lightweight polling for container statuses.
 * Fetches only status fields (id, status, statusText) at a fixed interval.
 * Pauses when the page is not visible or when explicitly paused.
 */
export function useStatusPolling(options: StatusPollingOptions) {
  const polling = ref(false)
  const paused = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  async function poll() {
    if (paused.value) return
    try {
      const response = await $fetch<{ success: boolean; data: ContainerStatusInfo[] }>('/api/containers/status')
      options.onUpdate(response.data)
    } catch {
      // Silently ignore polling errors — the user will see errors on manual refresh
    }
  }

  function start() {
    if (polling.value) return
    polling.value = true
    poll()
    intervalId = setInterval(poll, POLL_INTERVAL_MS)
  }

  function stop() {
    polling.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function pause() {
    paused.value = true
  }

  function resume() {
    paused.value = false
  }

  // Pause polling when page is hidden, resume when visible
  function handleVisibilityChange() {
    if (document.hidden) {
      pause()
    } else {
      resume()
      // Immediately poll when becoming visible again
      poll()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { polling, paused, start, stop, pause, resume }
}
