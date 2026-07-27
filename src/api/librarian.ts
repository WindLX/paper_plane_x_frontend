import { request } from './core'
import type {
  LibrarianAgentSummaryResponse,
  LibrarianGlobalFinderResponse,
  LibrarianGuideResponse,
  LibrarianQueryBuilderRequest,
  LibrarianQueryBuilderResponse,
  LibrarianUnifiedSearchRequest,
  LibrarianUnifiedSearchResponse,
} from '../types/api'

export const librarianApi = {
  getLibrarianGuide(): Promise<LibrarianGuideResponse> {
    return request('/librarian/guide')
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

  librarianQueryBuilder(
    payload: LibrarianQueryBuilderRequest,
  ): Promise<LibrarianQueryBuilderResponse> {
    return request('/librarian/query-builder', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  librarianForceAgentSummary(projectId: string): Promise<LibrarianAgentSummaryResponse> {
    return request('/librarian/global-finder/agent-summary', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    })
  },
}
