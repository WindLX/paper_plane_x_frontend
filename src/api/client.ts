import type {
  AgentTraceQueryResponse,
  DataProcessTaskListResponse,
  DataProcessTaskResponse,
  PaperListResponse,
  ProjectExportField,
  ProjectListResponse,
  ProjectResponse,
} from '../types/api'
import { appConfig } from '../config'
import { translate } from '../i18n'

const API_BASE_URL = appConfig.apiBaseUrl

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || translate('errors.requestFailed', { status: response.status }))
  }
  return (await response.json()) as T
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || translate('errors.requestFailed', { status: response.status }))
  }
  return await response.blob()
}

export const api = {
  listProjects(offset = 0, limit = 50): Promise<ProjectListResponse> {
    return request(`/projects?offset=${offset}&limit=${limit}`)
  },
  createProject(payload: { name: string; description?: string | null }): Promise<ProjectResponse> {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  deleteProject(projectId: string): Promise<{ message: string }> {
    return request(`/projects/${projectId}`, { method: 'DELETE' })
  },
  listProjectPapers(projectId: string, offset = 0, limit = 100): Promise<PaperListResponse> {
    return request(`/projects/${projectId}/papers?offset=${offset}&limit=${limit}`)
  },
  unlinkProjectPaper(projectId: string, paperId: string): Promise<{ message: string }> {
    return request(`/projects/${projectId}/papers/${paperId}`, { method: 'DELETE' })
  },
  exportProject(
    projectId: string,
    payload: { fields: ProjectExportField[]; citations_mode: 'keep' | 'strip' },
  ): Promise<Blob> {
    return requestBlob(`/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  listTasks(
    offset = 0,
    limit = 20,
    sortOrder?: 'asc' | 'desc',
  ): Promise<DataProcessTaskListResponse> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    })
    if (sortOrder) {
      params.set('sort_order', sortOrder)
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
  queryAgentTraces(traceIds: string[]): Promise<AgentTraceQueryResponse> {
    return request('/agent-traces/query', {
      method: 'POST',
      body: JSON.stringify({ trace_ids: traceIds }),
    })
  },
  deleteAgentTrace(traceId: string): Promise<{ message: string }> {
    return request(`/agent-traces/${traceId}`, { method: 'DELETE' })
  },
}
