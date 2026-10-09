import { API_BASE_URL, request, requestBlob, type BlobTransferOptions } from './core'
import type {
  ProjectActivityQuery,
  ProjectActivityListResponse,
  ProjectOverviewResponse,
  ProjectExportJob,
  ProjectExportJobListResponse,
  ProjectExportRequest,
} from '@/types/api'
import type {
  LibrarianUnifiedSearchRequest,
  LibrarianUnifiedSearchResponse,
  ProjectCreateRequest,
  ProjectExportField,
  ProjectFileContentResponse,
  ProjectFileDeleteResponse,
  ProjectFileExportRequest,
  ProjectFileListResponse,
  ProjectFileWriteRequest,
  ProjectFileWriteResponse,
  ProjectListResponse,
  ProjectResponse,
  ProjectUpdateRequest,
} from '../types/api'
import type { SortOrder, ProjectSortKey } from '../types/sort'

export const projectsApi = {
  getProjectOverview(projectId: string): Promise<ProjectOverviewResponse> {
    return request(`/projects/${projectId}/overview`)
  },

  listProjectActivities(
    projectId: string,
    query: ProjectActivityQuery = {},
  ): Promise<ProjectActivityListResponse> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, String(value))
    }
    return request(`/projects/${projectId}/activities?${params}`)
  },

  createProjectExport(projectId: string, payload: ProjectExportRequest): Promise<ProjectExportJob> {
    return request(`/projects/${projectId}/exports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  listProjectExports(projectId: string): Promise<ProjectExportJobListResponse> {
    return request(`/projects/${projectId}/exports`)
  },

  getProjectExport(projectId: string, exportId: string): Promise<ProjectExportJob> {
    return request(`/projects/${projectId}/exports/${exportId}`)
  },

  cancelProjectExport(projectId: string, exportId: string): Promise<ProjectExportJob> {
    return request(`/projects/${projectId}/exports/${exportId}/cancel`, { method: 'POST' })
  },

  downloadProjectExport(
    projectId: string,
    exportId: string,
    transfer?: BlobTransferOptions,
  ): Promise<Blob> {
    return requestBlob(`/projects/${projectId}/exports/${exportId}/download`, undefined, transfer)
  },

  projectFilePreviewUrl(projectId: string, filePath: string): string {
    return `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/files/preview?file_path=${encodeURIComponent(filePath)}`
  },
  listProjects(
    offset = 0,
    limit = 50,
    sortOrder?: SortOrder,
    sortBy?: ProjectSortKey,
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

  getProject(projectId: string): Promise<ProjectResponse> {
    return request(`/projects/${projectId}`)
  },

  createProject(payload: ProjectCreateRequest): Promise<ProjectResponse> {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateProject(projectId: string, payload: ProjectUpdateRequest): Promise<ProjectResponse> {
    return request(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deleteProject(projectId: string): Promise<{ message: string }> {
    return request(`/projects/${projectId}`, { method: 'DELETE' })
  },

  searchProject(
    projectId: string,
    payload: Omit<LibrarianUnifiedSearchRequest, 'project_id'>,
  ): Promise<LibrarianUnifiedSearchResponse> {
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
    payload: {
      fields: ProjectExportField[]
      citations_mode: 'keep' | 'strip'
      include_sandbox_files: boolean
    },
  ): Promise<Blob> {
    return requestBlob(`/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  setProjectAgentSummary(projectId: string, content: string): Promise<ProjectResponse> {
    return request(`/projects/${projectId}/agent-summary`, {
      method: 'PUT',
      body: JSON.stringify(content),
    })
  },

  deleteProjectAgentSummary(projectId: string): Promise<ProjectResponse> {
    return request(`/projects/${projectId}/agent-summary`, { method: 'DELETE' })
  },

  listProjectFiles(projectId: string, dirPath = '/'): Promise<ProjectFileListResponse> {
    return request(`/projects/${projectId}/files?dir_path=${encodeURIComponent(dirPath)}`)
  },

  readProjectFile(projectId: string, filePath: string): Promise<ProjectFileContentResponse> {
    return request(`/projects/${projectId}/files/content?file_path=${encodeURIComponent(filePath)}`)
  },

  writeProjectFile(
    projectId: string,
    payload: ProjectFileWriteRequest,
  ): Promise<ProjectFileWriteResponse> {
    return request(`/projects/${projectId}/files/content`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  uploadProjectFile(
    projectId: string,
    filePath: string,
    file: File,
  ): Promise<ProjectFileWriteResponse> {
    const body = new FormData()
    body.append('file_path', filePath)
    body.append('file', file)
    return request(`/projects/${projectId}/files/upload`, {
      method: 'POST',
      headers: {},
      body,
    })
  },

  downloadProjectFile(projectId: string, filePath: string): Promise<Blob> {
    return requestBlob(
      `/projects/${projectId}/files/download?file_path=${encodeURIComponent(filePath)}`,
    )
  },

  deleteProjectFile(projectId: string, filePath: string): Promise<ProjectFileDeleteResponse> {
    const params = new URLSearchParams({
      file_path: filePath,
    })
    return request(`/projects/${projectId}/files/content?${params.toString()}`, {
      method: 'DELETE',
    })
  },

  exportProjectFile(
    projectId: string,
    payload: ProjectFileExportRequest,
    transfer?: BlobTransferOptions,
  ): Promise<Blob> {
    return requestBlob(
      `/projects/${projectId}/files/export`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      transfer,
    )
  },
}
