import type { LibrarySearchInputState } from '@/types/api'

export interface LibrarySearchSelection {
  simpleQuery: string
  paperId: string
  queryExpr: string
  executionQuery: string | null
}

export class LibrarySearchModeConflictError extends Error {
  constructor() {
    super('paper_id and query_expr cannot be used together')
    this.name = 'LibrarySearchModeConflictError'
  }
}

export function resolveLibrarySearchSelection(
  state: LibrarySearchInputState,
): LibrarySearchSelection {
  if (state.mode === 'simple') {
    const simpleQuery = state.rawInput.trim()
    return {
      simpleQuery,
      paperId: '',
      queryExpr: '',
      executionQuery: simpleQuery || null,
    }
  }

  const paperId = state.paperId.trim()
  const queryExpr = state.queryExpr.trim()
  if (paperId && queryExpr) {
    throw new LibrarySearchModeConflictError()
  }
  return {
    simpleQuery: '',
    paperId,
    queryExpr,
    executionQuery: paperId || queryExpr || null,
  }
}
