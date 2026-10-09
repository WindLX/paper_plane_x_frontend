import type { LibrarianGlobalFinderYearDistribution, LibrarianTagCount } from './librarian'

export type ProjectActivityCategory = 'project' | 'paper' | 'file' | 'task' | 'agent' | 'export'
export type ProjectActivityStatus =
  | 'info'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceled'

export interface ProjectActivity {
  activity_id: string
  project_id: string
  category: ProjectActivityCategory
  event_type: string
  status: ProjectActivityStatus
  object_name: string | null
  paper_id: string | null
  file_path: string | null
  task_id: string | null
  trace_ids: string[]
  created_at: string
  updated_at: string
  started_at: string | null
  finished_at: string | null
  error: string | null
  retry_of_task_id: string | null
  task_exists: boolean
  detail: Record<string, unknown>
}

export interface ProjectActivityQuery {
  offset?: number
  limit?: number
  category?: ProjectActivityCategory
  status?: ProjectActivityStatus
  created_at_from?: string
  created_at_to?: string
  keyword?: string
}

export interface ProjectActivityListResponse {
  items: ProjectActivity[]
  total: number
  offset: number
  limit: number
}

export interface ProjectOverviewResponse {
  project_id: string
  agent_summary: string | null
  stats: {
    paper_count: number
    parsed_count: number
    active_task_count: number
    attention_count: number
  }
  attention_items: Array<{
    paper_id: string
    title: string | null
    stage: string
    error: string | null
    task_id: string | null
  }>
  recent_papers: Array<{ paper_id: string; title: string | null; updated_at: string }>
  recent_files: Array<{
    file_path: string
    name: string
    kind: 'text' | 'image'
    size: number
    updated_at: string
  }>
  recent_activities: ProjectActivity[]
  top_tags: LibrarianTagCount[]
  year_distribution: LibrarianGlobalFinderYearDistribution
  year_range: string | null
  section_errors: Record<string, string>
}

export type ProjectExportStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'expired'
export type ProjectExportPhase = 'queued' | 'preparing' | 'packing' | 'finalizing' | 'ready'

export interface ProjectExportJob {
  export_id: string
  project_id: string
  status: ProjectExportStatus
  phase: ProjectExportPhase
  processed_files: number
  total_files: number | null
  current_file: string | null
  error: string | null
  download_name: string | null
  file_size: number | null
  created_at: string
  finished_at: string | null
  expires_at: string | null
  cancel_requested: boolean
}

export interface ProjectExportJobListResponse {
  items: ProjectExportJob[]
}
