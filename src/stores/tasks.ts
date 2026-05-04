import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { translate } from '../i18n'
import { api } from '@/api'
import { usePagination } from '@/composables/usePagination'
import type { TaskSortKey } from '@/types/sort'
import type { DataProcessTaskListResponse, DataProcessTaskResponse } from '@/types/api'

export const useTaskStore = defineStore('tasks', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const queued = ref(0)
  const running = ref(0)
  const completed = ref(0)
  const failed = ref(0)
  const canceled = ref(0)
  const lastUpdatedAt = ref<string | null>(null)

  const paginated = usePagination<
    DataProcessTaskResponse,
    TaskSortKey,
    DataProcessTaskListResponse
  >({
    fetcher: ({ offset, limit, sortOrder, sortBy }) =>
      api.listTasks(offset, limit, sortOrder, sortBy),
    defaultLimit: 20,
  })

  const taskMap = computed(() => {
    const map: Record<string, DataProcessTaskResponse> = {}
    for (const task of paginated.items.value) {
      map[task.task_id] = task
    }
    return map
  })

  async function fetchTasks(options?: Parameters<typeof paginated.fetch>[0]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const payload = await paginated.fetch(options)
      queued.value = payload.queued
      running.value = payload.running
      completed.value = payload.completed
      failed.value = payload.failed
      canceled.value = payload.canceled
      lastUpdatedAt.value = new Date().toISOString()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('errors.fetchTasks')
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
    tasks: paginated.items,
    loading,
    error,
    queued,
    running,
    completed,
    failed,
    canceled,
    total: paginated.total,
    offset: paginated.offset,
    limit: paginated.limit,
    sortOrder: paginated.sortOrder,
    sortBy: paginated.sortBy,
    totalPages: paginated.totalPages,
    currentPage: paginated.currentPage,
    hasPrevPage: paginated.hasPrevPage,
    hasNextPage: paginated.hasNextPage,
    lastUpdatedAt,
    fetchTasks,
    fetchTaskById,
    setPage: paginated.setPage,
    nextPage: paginated.nextPage,
    prevPage: paginated.prevPage,
    setLimit: paginated.setLimit,
    toggleSort: paginated.toggleSort,
    cancelTask,
    retryTask,
    deleteTask,
    getTask,
  }
})
