import { onUnmounted, ref } from 'vue'

export function useAutoRefresh(fetchFn: () => void | Promise<void>, intervalMs = 5000) {
  const autoRefreshEnabled = ref(false)
  const refreshing = ref(false)
  let autoRefreshTimer: number | null = null
  let refreshSpinTimer: number | null = null

  function startAutoRefresh(): void {
    if (autoRefreshTimer !== null) return
    autoRefreshTimer = window.setInterval(() => {
      void fetchFn()
    }, intervalMs)
  }

  function stopAutoRefresh(): void {
    if (autoRefreshTimer !== null) {
      window.clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
  }

  function triggerSpin(duration = 680): void {
    refreshing.value = true
    if (refreshSpinTimer !== null) {
      window.clearTimeout(refreshSpinTimer)
    }
    refreshSpinTimer = window.setTimeout(() => {
      refreshing.value = false
    }, duration)
  }

  function toggleAutoRefresh(): void {
    triggerSpin()
    autoRefreshEnabled.value = !autoRefreshEnabled.value
    if (autoRefreshEnabled.value) {
      void fetchFn()
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  onUnmounted(() => {
    if (autoRefreshTimer !== null) {
      window.clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
    if (refreshSpinTimer !== null) {
      window.clearTimeout(refreshSpinTimer)
      refreshSpinTimer = null
    }
  })

  return {
    autoRefreshEnabled,
    refreshing,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    triggerSpin,
  }
}
