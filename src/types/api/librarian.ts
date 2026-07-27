import type { SortOrder, PaperSortKey } from '../sort'

export interface LibrarianUnifiedSearchRequest {
  project_id?: string | null
  paper_id?: string | null
  simple_query?: string | null
  query_expr?: string | null
  limit?: number
  offset?: number
  sort_by?: PaperSortKey
  sort_order?: SortOrder
  only_completed?: boolean
}

export interface LibrarianGuideResponse {
  query_schema: {
    mode: string
    project_id: string
    paper_id: string
    simple_query: {
      description: string
      fields: string[]
    }
    query_expr: Record<string, unknown>
    paging: {
      limit: string
      offset: string
    }
  }
  query_examples: string[]
  project_query_tips: string[]
}

export interface LibrarianUnifiedSearchResponse {
  project_id: string | null
  limit: number
  offset: number
  total: number
  paper_ids: string[]
}

export interface LibrarianQueryBuilderRequest {
  query: string
  project_context?: string | null
}

export interface LibrarianQueryBuilderResponse {
  query_expr: string
  explanation: string
}

export interface LibrarySearchInputState {
  rawInput: string
  mode: 'simple' | 'advanced'
  queryExpr: string
  projectScope: string
  paperId: string
  parsedQuery?: string | null
  executionQuery?: string | null
}

export interface LibrarianGlobalFinderQuickScanSummary {
  tags: string[]
  verdict: string | null
  reason: string | null
  quick_summary: string | null
}

export interface LibrarianGlobalFinderPaperSummary {
  paper_id: string
  title: string | null
  authors: string[]
  year: number | null
  quick_scan: LibrarianGlobalFinderQuickScanSummary | null
}

export interface LibrarianGlobalFinderYearDistribution {
  available_count: number
  missing_count: number
  mean: number | null
  variance: number | null
  median: number | null
  mode_years: number[]
  q25: number | null
  q75: number | null
  outlier_count: number
  low_outlier_count: number
  high_outlier_count: number
}

export interface LibrarianTagCount {
  tag: string
  count: number
}

export interface LibrarianGlobalFinderResponse {
  project_id: string
  papers: LibrarianGlobalFinderPaperSummary[]
  stats: {
    paper_count: number
    top_tags_limit: number
    year_range: string | null
    year_distribution: LibrarianGlobalFinderYearDistribution
    top_tags: LibrarianTagCount[]
  }
  agent_summary: string | null
}

export interface LibrarianAgentSummaryResponse {
  project_id: string
  agent_summary: string | null
}
