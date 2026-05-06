import { defineStore } from 'pinia'
import { ref } from 'vue'

import { tasksApi } from '@/api/tasks'
import { useNotify } from '@/composables/useNotify'
import type { DataProcessTaskResponse } from '@/types/api'
import type { DataProcessSocketStatus } from '@/api/tasks'

export const useTasksWsStore = defineStore('tasksWs', () => {
  const notify = useNotify()

  const wsClient = ref<ReturnType<typeof tasksApi.createWebSocketClient> | null>(null)
  const status = ref<DataProcessSocketStatus>('idle')
  const lastUpdatedTask = ref<DataProcessTaskResponse | null>(null)
  const error = ref<string | null>(null)

  function connect(): void {
    if (wsClient.value) return

    const client = tasksApi.createWebSocketClient()

    client.onStatusChange((nextStatus) => {
      status.value = nextStatus
    })

    client.onTaskUpdate((task) => {
      lastUpdatedTask.value = task
      notify.push(`Task ${task.task_id.slice(0, 12)}… ${task.status}`, 'info', 2000)
    })

    client.onError((nextError) => {
      error.value = nextError
      notify.push(`Tasks WebSocket error: ${nextError}`, 'error', 3600)
    })

    client.connect()
    wsClient.value = client
  }

  function disconnect(): void {
    wsClient.value?.disconnect()
    wsClient.value = null
    status.value = 'idle'
  }

  return {
    status,
    lastUpdatedTask,
    error,
    connect,
    disconnect,
  }
})
