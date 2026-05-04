export interface ProjectResponse {
  project_id: string
  name: string
  description: string | null
  agent_summary: string | null
  created_at: string
  updated_at: string
  operation_logs: Record<string, unknown>[]
  conversation_count: number
}

export interface ProjectListResponse {
  items: ProjectResponse[]
  total: number
  offset: number
  limit: number
}

export interface ProjectCreateRequest {
  name: string
  description?: string | null
  agent_summary?: string | null
}

export interface ProjectUpdateRequest {
  name?: string | null
  description?: string | null
  agent_summary?: string | null
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

// ---- Project Sandbox File Types ----

export interface ProjectFileItem {
  name: string
  is_dir: boolean
  size: number | null
}

export interface ProjectFileListResponse {
  items: ProjectFileItem[]
}

export interface ProjectFileContentResponse {
  file_path: string
  content: string
}

export interface ProjectFileWriteRequest {
  file_path: string
  content: string
  is_dir?: boolean
}

export interface ProjectFileWriteResponse {
  file_path: string
  bytes_written: number
  is_dir: boolean
}

export interface ProjectFileDeleteResponse {
  removed: string
}

export interface ProjectFileExportRequest {
  file_path: string
  format: 'markdown' | 'docx' | 'pdf' | 'html'
}
