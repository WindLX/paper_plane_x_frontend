import { request } from './core'
import type { DataProcessTaskListResponse, DataProcessTaskResponse } from '../types/api'
import type { SortOrder, TaskSortKey } from '../types/sort'

export const tasksApi = {
  listTasks(
    offset = 0,
    limit = 20,
    sortOrder?: SortOrder,
    sortBy?: TaskSortKey,
  ): Promise<DataProcessTaskListResponse> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    })
    if (sortOrder) {
      params.set('sort_order', sortOrder)
    }
    if (sortBy) {
      params.set('sort_by', sortBy)
    }
    return request(`/data-process/tasks?${params.toString()}`)
  },

  getTask(taskId: string): Promise<DataProcessTaskResponse> {
    return request(`/data-process/tasks/${taskId}`)
  },

  cancelTask(taskId: string): Promise<DataProcessTaskResponse> {
    return request(`/data-process/tasks/${taskId}/cancel`, { method: 'POST' })
  },

  retryTask(taskId: string): Promise<DataProcessTaskResponse> {
    return request(`/data-process/tasks/${taskId}/retry`, { method: 'POST' })
  },

  deleteTask(taskId: string): Promise<{ message: string }> {
    return request(`/data-process/tasks/${taskId}`, { method: 'DELETE' })
  },
}
