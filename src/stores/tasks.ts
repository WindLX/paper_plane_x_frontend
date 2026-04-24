import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '../api/client'
import type { DataProcessTaskResponse } from '../types/api'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<DataProcessTaskResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const queued = ref(0)
  const running = ref(0)
  const completed = ref(0)
  const failed = ref(0)
  const canceled = ref(0)
  const total = ref(0)
  const offset = ref(0)
  const limit = ref(20)
  const sortOrder = ref<'default' | 'asc' | 'desc'>('default')
  const lastUpdatedAt = ref<string | null>(null)

  const totalPages = computed(() => {
    if (limit.value <= 0) return 1
    return Math.max(1, Math.ceil(total.value / limit.value))
  })
  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
  const hasPrevPage = computed(() => offset.value > 0)
  const hasNextPage = computed(() => offset.value + limit.value < total.value)

  const taskMap = computed(() => {
    const map: Record<string, DataProcessTaskResponse> = {}
    for (const task of tasks.value) {
      map[task.task_id] = task
    }
    return map
  })

  async function fetchTasks(options?: {
    offset?: number
    limit?: number
    sortOrder?: 'default' | 'asc' | 'desc'
  }): Promise<void> {
    loading.value = true
    error.value = null
    const nextOffset = options?.offset ?? offset.value
    const nextLimit = options?.limit ?? limit.value
    const nextSortOrder = options?.sortOrder ?? sortOrder.value
    try {
      const payload = await api.listTasks(
        nextOffset,
        nextLimit,
        nextSortOrder === 'default' ? undefined : nextSortOrder,
      )
      tasks.value = payload.items
      queued.value = payload.queued
      running.value = payload.running
      completed.value = payload.completed
      failed.value = payload.failed
      canceled.value = payload.canceled
      total.value = payload.total
      offset.value = payload.offset
      limit.value = payload.limit
      sortOrder.value = nextSortOrder
      lastUpdatedAt.value = new Date().toISOString()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tasks'
    } finally {
      loading.value = false
    }
  }

  async function fetchTaskById(taskId: string): Promise<DataProcessTaskResponse | null> {
    try {
      const task = await api.getTask(taskId)
      return task
    } catch {
      return null
    }
  }

  async function setPage(page: number): Promise<void> {
    const targetPage = Math.max(1, Math.min(page, totalPages.value))
    const nextOffset = (targetPage - 1) * limit.value
    await fetchTasks({ offset: nextOffset, limit: limit.value })
  }

  async function nextPage(): Promise<void> {
    if (!hasNextPage.value) return
    await fetchTasks({ offset: offset.value + limit.value, limit: limit.value })
  }

  async function prevPage(): Promise<void> {
    if (!hasPrevPage.value) return
    await fetchTasks({ offset: Math.max(0, offset.value - limit.value), limit: limit.value })
  }

  async function setLimit(nextLimit: number): Promise<void> {
    const normalized = Math.max(1, Math.min(nextLimit, 200))
    await fetchTasks({ offset: 0, limit: normalized })
  }

  async function setSortOrder(nextSortOrder: 'default' | 'asc' | 'desc'): Promise<void> {
    await fetchTasks({ offset: 0, limit: limit.value, sortOrder: nextSortOrder })
  }

  async function cancelTask(taskId: string): Promise<void> {
    await api.cancelTask(taskId)
    await fetchTasks()
  }

  async function retryTask(taskId: string): Promise<void> {
    await api.retryTask(taskId)
    await fetchTasks()
  }

  async function deleteTask(taskId: string): Promise<void> {
    await api.deleteTask(taskId)
    await fetchTasks()
  }

  function getTask(taskId: string): DataProcessTaskResponse | undefined {
    return taskMap.value[taskId]
  }

  return {
    tasks,
    loading,
    error,
    queued,
    running,
    completed,
    failed,
    canceled,
    total,
    offset,
    limit,
    sortOrder,
    totalPages,
    currentPage,
    hasPrevPage,
    hasNextPage,
    lastUpdatedAt,
    fetchTasks,
    fetchTaskById,
    setPage,
    nextPage,
    prevPage,
    setLimit,
    setSortOrder,
    cancelTask,
    retryTask,
    deleteTask,
    getTask,
  }
})
