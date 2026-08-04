import { API_BASE_URL, request } from './core'
import type {
  DataProcessManualUpdateRequest,
  DataProcessSubmitResponse,
  PaperAgentNoteRequest,
  PaperAgentNoteResponse,
  PaperDetailResponse,
  PaperListResponse,
  PaperStatusCountResponse,
} from '../types/api'
import type { SortOrder, PaperSortKey } from '../types/sort'

export const papersApi = {
  batchGetPapers(
    paperIds: string[],
    offset = 0,
    limit = 100,
    sortOrder?: SortOrder,
    sortBy?: PaperSortKey,
  ): Promise<PaperListResponse> {
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

  getPaper(paperId: string): Promise<PaperDetailResponse> {
    return request(`/papers/${paperId}`)
  },

  getPaperStatusCounts(): Promise<PaperStatusCountResponse> {
    return request('/papers/status-counts')
  },

  getProjectPaperStatusCounts(projectId: string): Promise<PaperStatusCountResponse> {
    return request(`/projects/${projectId}/papers/status-counts`)
  },

  listPapers(
    offset = 0,
    limit = 20,
    sortOrder?: SortOrder,
    sortBy?: PaperSortKey,
  ): Promise<PaperListResponse> {
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
    return request(`/papers?${params.toString()}`)
  },

  createPaper(formData: FormData): Promise<DataProcessSubmitResponse> {
    return request('/papers', {
      method: 'POST',
      body: formData,
    })
  },

  updatePaper(
    paperId: string,
    payload: DataProcessManualUpdateRequest,
  ): Promise<PaperDetailResponse> {
    return request(`/papers/${paperId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  reprocessPaper(paperId: string, formData: FormData): Promise<DataProcessSubmitResponse> {
    return request(`/papers/${paperId}/reprocess`, {
      method: 'POST',
      body: formData,
    })
  },

  deletePaper(paperId: string): Promise<{ message: string }> {
    return request(`/papers/${paperId}`, { method: 'DELETE' })
  },

  updatePaperAgentNote(
    paperId: string,
    payload: PaperAgentNoteRequest,
  ): Promise<PaperAgentNoteResponse> {
    return request(`/papers/${paperId}/agent-note`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  deletePaperAgentNote(paperId: string): Promise<PaperAgentNoteResponse> {
    return request(`/papers/${paperId}/agent-note`, {
      method: 'DELETE',
    })
  },

  getPaperPdfUrl(paperId: string, download = false): string {
    const path = `/papers/${encodeURIComponent(paperId)}/pdf`
    return `${API_BASE_URL}${path}${download ? '?download=true' : ''}`
  },

  async checkPaperPdf(paperId: string, signal?: AbortSignal): Promise<void> {
    const response = await fetch(papersApi.getPaperPdfUrl(paperId), {
      headers: { Range: 'bytes=0-0' },
      signal,
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `PDF request failed (${response.status})`)
    }
  },
}
