export type DataProcessTaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'CANCELING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'

export interface DataProcessSubmitResponse {
  task_id: string
  status: DataProcessTaskStatus
  paper_id: string | null
  resource_type: string | null
  resource_id: string | null
  message: string
}

export interface DataProcessManualUpdateRequest {
  title?: string | null
  authors?: string[] | null
  year?: number | null
  publication?: string | null
  doi?: string | null
  custom_meta?: string | null
  extraction_status?: 'HUMAN_COMPLETED' | 'FAILED' | null
  quick_scan?: Record<string, unknown> | null
  synthesis_data?: Record<string, unknown> | null
  analysis_report?: Record<string, unknown> | null
  extraction_fact_check_status?: 'HUMAN_PASSED' | 'FAILED' | null
  extraction_fact_check_result?: Record<string, unknown> | null
  analysis_fact_check_status?: 'HUMAN_PASSED' | 'FAILED' | null
  analysis_fact_check_result?: Record<string, unknown> | null
  agent_note?: string | null
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
