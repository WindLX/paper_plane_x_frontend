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

export type TraceMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | unknown[] | null
  reasoning_content?: string | null
  name?: string | null
  tool_calls?: unknown[] | null
  tool_call_id?: string | null
}
