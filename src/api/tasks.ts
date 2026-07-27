import { request } from './core'
import { BaseWebSocketClient, type WebSocketStatus } from './ws'
import type { DataProcessTaskListResponse, DataProcessTaskResponse } from '../types/api'
import type { SortOrder, TaskSortKey } from '../types/sort'

export type DataProcessSocketStatus = WebSocketStatus

export interface DataProcessSocketMessage {
  type: 'task_update' | 'pong' | 'error'
  task?: DataProcessTaskResponse
  detail?: string
}

export function buildTaskListSearchParams(
  offset: number,
  limit: number,
  sortOrder?: SortOrder,
  sortBy?: TaskSortKey,
  keyword?: string,
): URLSearchParams {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  })
  if (sortOrder) params.set('sort_order', sortOrder)
  if (sortBy) params.set('sort_by', sortBy)
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  return params
}

export class DataProcessWebSocketClient extends BaseWebSocketClient<DataProcessSocketMessage> {
  private onTaskUpdateCallback: ((task: DataProcessTaskResponse) => void) | null = null

  constructor() {
    super({
      path: '/ws/data-process',
      heartbeatIntervalMs: 30000,
      heartbeatPayload: { type: 'ping' },
    })

    this.onMessage((data) => {
      this.handleMessage(data)
    })
  }

  onTaskUpdate(callback: (task: DataProcessTaskResponse) => void): void {
    this.onTaskUpdateCallback = callback
  }

  private handleMessage(data: DataProcessSocketMessage): void {
    switch (data.type) {
      case 'task_update': {
        if (data.task) {
          this.onTaskUpdateCallback?.(data.task)
        }
        break
      }
      case 'error': {
        this.reportError(data.detail || 'Unknown data-process error')
        break
      }
      case 'pong':
        break
    }
  }
}

export const tasksApi = {
  listTasks(
    offset = 0,
    limit = 20,
    sortOrder?: SortOrder,
    sortBy?: TaskSortKey,
    keyword?: string,
  ): Promise<DataProcessTaskListResponse> {
    const params = buildTaskListSearchParams(offset, limit, sortOrder, sortBy, keyword)
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

  createWebSocketClient(): DataProcessWebSocketClient {
    return new DataProcessWebSocketClient()
  },
}
