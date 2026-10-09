import type { ProjectActivity } from '@/types/api'

// Backend activity codes are snake_case event identifiers. Each known code maps
// to an i18n key; unknown codes fall back to the raw code so new backend events
// stay visible instead of being silently dropped.
const EVENT_KEYS: Record<string, string> = {
  project_created: 'workbench.activity.events.projectCreated',
  project_updated: 'workbench.activity.events.projectUpdated',
  paper_linked: 'workbench.activity.events.paperLinked',
  paper_unlinked: 'workbench.activity.events.paperUnlinked',
  task_queued: 'workbench.activity.events.taskQueued',
  task_started: 'workbench.activity.events.taskStarted',
  task_canceling: 'workbench.activity.events.taskCanceling',
  task_completed: 'workbench.activity.events.taskCompleted',
  task_failed: 'workbench.activity.events.taskFailed',
  task_canceled: 'workbench.activity.events.taskCanceled',
  global_finder_started: 'workbench.activity.events.globalFinderStarted',
  librarian_global_finder_started: 'workbench.activity.events.globalFinderStarted',
  project_summary_updated: 'workbench.activity.events.projectSummaryUpdated',
  agent_summary: 'workbench.activity.events.globalFinderStarted',
  summary_updated: 'workbench.activity.events.projectSummaryUpdated',
  summary_cleared: 'workbench.activity.events.projectSummaryCleared',
  file_written: 'workbench.activity.events.fileWritten',
  file_uploaded: 'workbench.activity.events.fileUploaded',
  file_deleted: 'workbench.activity.events.fileDeleted',
  directory_created: 'workbench.activity.events.directoryCreated',
  directory_deleted: 'workbench.activity.events.directoryDeleted',
  file_exported: 'workbench.activity.events.fileExported',
  project_exported: 'workbench.activity.events.projectExported',
}

// Attention stages reported by the overview endpoint.
const STAGE_KEYS: Record<string, string> = {
  task_failed: 'workbench.activity.stages.failed',
  parse_failed: 'workbench.activity.stages.parsing',
  extraction_fact_check_failed: 'workbench.activity.stages.extractionFactCheck',
  analysis_fact_check_failed: 'workbench.activity.stages.analysisFactCheck',
  parsing: 'workbench.activity.stages.parsing',
  extraction: 'workbench.activity.stages.extraction',
  extraction_fact_check: 'workbench.activity.stages.extractionFactCheck',
  analysis: 'workbench.activity.stages.analysis',
  analysis_fact_check: 'workbench.activity.stages.analysisFactCheck',
  quick_scan: 'workbench.activity.stages.quickScan',
  indexing: 'workbench.activity.stages.indexing',
  embedding: 'workbench.activity.stages.embedding',
  export: 'workbench.activity.stages.export',
  pending: 'workbench.activity.stages.pending',
  failed: 'workbench.activity.stages.failed',
}

/** i18n key for a backend activity event code, or null when the code is unknown. */
export function activityEventKey(eventType: string): string | null {
  return EVENT_KEYS[eventType] ?? null
}

/** i18n key for an attention stage, or null when the stage is unknown. */
export function activityStageKey(stage: string | null | undefined): string | null {
  if (!stage) return null
  return STAGE_KEYS[stage] ?? null
}

/** Prefer the human object name, then the file path, then the paper id. */
export function activityObjectName(
  activity: Pick<ProjectActivity, 'object_name' | 'file_path' | 'paper_id'>,
): string {
  return activity.object_name ?? activity.file_path ?? activity.paper_id ?? ''
}
