import type {
  AgentTraceQueryResponse,
  LibrarianGuideResponse,
  LibrarianGlobalFinderResponse,
  LibrarianMatrixResponse,
  LibrarianProjectionResponse,
  LibrarianUnifiedSearchRequest,
  LibrarianUnifiedSearchResponse,
  DataProcessTaskListResponse,
  DataProcessTaskResponse,
  PaperListResponse,
  ProjectExportField,
  ProjectListResponse,
  ProjectResponse,
} from '../types/api'
import type { SortOrder, PaperSortKey, ProjectSortKey, TaskSortKey } from '../types/sort'
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
  batchGetPapers(paperIds: string[], offset = 0, limit = 100, sortOrder?: SortOrder, sortBy?: PaperSortKey): Promise<PaperListResponse> {
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
    return request(`/papers/batch-get?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(paperIds),
    })
  },
  listProjects(
    offset = 0,
    limit = 50,
    sortOrder?: SortOrder,
    sortBy?: ProjectSortKey
  ): Promise<ProjectListResponse> {
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
    return request(`/projects?${params.toString()}`)
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
  searchProject(projectId: string, payload: Omit<LibrarianUnifiedSearchRequest, 'project_id'>): Promise<LibrarianUnifiedSearchResponse> {
    return request(`/projects/${projectId}/search`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  linkProjectPaper(projectId: string, paperId: string): Promise<{ message: string }> {
    return request(`/projects/${projectId}/papers/${paperId}`, { method: 'POST' })
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
    sortOrder?: SortOrder,
    sortBy?: TaskSortKey
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
  queryAgentTraces(traceIds: string[]): Promise<AgentTraceQueryResponse> {
    return request('/agent-traces/query', {
      method: 'POST',
      body: JSON.stringify({ trace_ids: traceIds }),
    })
  },
  librarianProjection(paperId: string, fieldPath: string): Promise<LibrarianProjectionResponse> {
    return request('/librarian/projection', {
      method: 'POST',
      body: JSON.stringify({ paper_id: paperId, field_path: fieldPath }),
    })
  },
  librarianMatrix(paperIds: string[], fieldPaths: string[]): Promise<LibrarianMatrixResponse> {
    return request('/librarian/matrix', {
      method: 'POST',
      body: JSON.stringify({ paper_ids: paperIds, field_paths: fieldPaths }),
    })
  },
  librarianSearch(payload: LibrarianUnifiedSearchRequest): Promise<LibrarianUnifiedSearchResponse> {
    return request('/librarian/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  librarianGlobalFinder(projectId: string): Promise<LibrarianGlobalFinderResponse> {
    return request('/librarian/global-finder', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    })
  },
  getLibrarianGuide(): Promise<LibrarianGuideResponse> {
    return request('/librarian/guide')
  },
  deleteAgentTrace(traceId: string): Promise<{ message: string }> {
    return request(`/agent-traces/${traceId}`, { method: 'DELETE' })
  },
}
