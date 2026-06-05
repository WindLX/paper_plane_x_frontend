export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'HUMAN_COMPLETED' | 'FAILED'

export type FactCheckStatus = 'PENDING' | 'PASSED' | 'HUMAN_PASSED' | 'FAILED'

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
  extraction_status: ExtractionStatus
  extraction_fact_check_status: FactCheckStatus
  analysis_fact_check_status: FactCheckStatus
  extraction_retry_count: number
  analysis_retry_count: number
  agent_note: string | null
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

export interface PaperStatusCountResponse {
  total: number
  extraction_pending: number
  extraction_processing: number
  extraction_completed: number
  extraction_human_completed: number
  extraction_failed: number
  extraction_fact_check_pending: number
  extraction_fact_check_passed: number
  extraction_fact_check_human_passed: number
  extraction_fact_check_failed: number
  analysis_fact_check_pending: number
  analysis_fact_check_passed: number
  analysis_fact_check_human_passed: number
  analysis_fact_check_failed: number
}
