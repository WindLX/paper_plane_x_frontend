import type { SortOrder, PaperSortKey } from "./sort"

export type DataProcessTaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'CANCELING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'

export interface ProjectResponse {
  project_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  operation_logs: Record<string, unknown>[]
}

export interface ProjectListResponse {
  items: ProjectResponse[]
  total: number
  offset: number
  limit: number
}

export type ProjectExportField =
  | 'paper_id'
  | 'project_ids'
  | 'title'
  | 'authors'
  | 'year'
  | 'publication'
  | 'doi'
  | 'custom_meta'
  | 'raw_pdf_path'
  | 'raw_pdf_sha256'
  | 'images_paths'
  | 'extraction_status'
  | 'extraction_fact_check_status'
  | 'analysis_fact_check_status'
  | 'extraction_retry_count'
  | 'analysis_retry_count'
  | 'created_at'
  | 'updated_at'
  | 'quick_scan'
  | 'synthesis_data'
  | 'analysis_report'
  | 'extraction_fact_check_result'
  | 'analysis_fact_check_result'

export interface PaperResponse {
  paper_id: string
  project_ids: string[]
  title: string | null
  authors: string[]
  year: number | null
  publication: string | null
  doi: string | null
  custom_meta: string | null
  raw_pdf_path: string | null
  raw_pdf_sha256: string | null
  images_paths: string[]
  extraction_status: string
  extraction_fact_check_status: string
  analysis_fact_check_status: string
  extraction_retry_count: number
  analysis_retry_count: number
  created_at: string
  updated_at: string
}

export interface RelatedReference {
  title?: string
  reason?: string
}

export interface AnalysisReport {
  prerequisites?: Array<{
    concept_name?: string
    brief_explanation?: string
    relevance_to_paper?: {
      text: string
      citations: Array<{
        quote: string
        source_header: string
      }>
    }
  }>
  core_formulation?: {
    problem_definition?: {
      text: string
      citations: Array<{
        quote: string
        source_header: string
      }>
    }
    objective_function?: {
      text: string
      citations: Array<{
        quote: string
        source_header: string
      }>
    }
    algorithm_flow?: {
      text: string
      citations: Array<{
        quote: string
        source_header: string
      }>
    }
  }
  derivation_steps?: Array<{
    step_order?: number
    step_name?: string
    detail_explanation?: {
      text: string
      citations: Array<{
        quote: string
        source_header: string
      }>
    }
  }>
  related_references?: RelatedReference[]
}

export interface PaperDetailResponse extends PaperResponse {
  quick_scan?: Record<string, unknown> | null
  synthesis_data?: Record<string, unknown> | null
  analysis_report?: AnalysisReport | null
  extraction_fact_check_result?: Record<string, unknown> | null
  analysis_fact_check_result?: Record<string, unknown> | null
}

export interface PaperListResponse {
  items: PaperResponse[]
  total: number
  offset: number
  limit: number
}

export interface DataProcessTaskResponse {
  task_id: string
  paper_id: string
  status: DataProcessTaskStatus
  created_at: string
  started_at: string | null
  finished_at: string | null
  error: string | null
  retry_of_task_id: string | null
  extraction_trace_ids: string[]
  analysis_trace_ids: string[]
  extraction_fact_check_trace_ids: string[]
  analysis_fact_check_trace_ids: string[]
}

export interface DataProcessTaskListResponse {
  queued: number
  running: number
  completed: number
  failed: number
  canceled: number
  total: number
  offset: number
  limit: number
  items: DataProcessTaskResponse[]
}

export interface AgentTraceResponse {
  trace_id: string
  agent_name: string
  messages: TraceMessage[]
  llm_model: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  usage_payload: Record<string, unknown> | null
  created_at: string
}

export interface AgentTraceQueryResponse {
  items: AgentTraceResponse[]
}

export interface LibrarianProjectionResponse {
  paper_id: string
  field_path: string
  value: unknown | null
}

export interface LibrarianMatrixResponse {
  paper_ids: string[]
  field_paths: string[]
  items: Record<string, Record<string, unknown | null>>
}

export interface LibrarianUnifiedSearchRequest {
  project_id?: string | null
  paper_id?: string | null
  query_expr?: string | null
  limit?: number
  offset?: number
  sort_by?: PaperSortKey
  sort_order?: SortOrder
}

export interface LibrarianUnifiedSearchResponse {
  project_id: string | null
  limit: number
  offset: number
  total: number
  paper_ids: string[]
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
    year_distribution: LibrarianGlobalFinderYearDistribution
    top_tags: LibrarianTagCount[]
  }
}

export interface LibrarianGuideResponse {
  field_paths_guide: string
  global_finder_schema: Record<string, unknown>
  query_schema: Record<string, unknown>
  projection_schema: Record<string, unknown>
  matrix_schema: Record<string, unknown>
  query_examples: string[]
  projection_examples: string[]
  matrix_tips: string[]
  project_query_tips: string[]
  global_finder_tips: string[]
}

export type TraceMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | unknown[] | null
  reasoning_content?: string | null
  name?: string | null
  tool_calls?: unknown[] | null
  tool_call_id?: string | null
}
