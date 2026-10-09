import type { Component } from 'vue'
import {
  Archive,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock3,
  FileText,
  FolderOpen,
  Info,
  ListChecks,
  LoaderCircle,
  Sparkles,
} from 'lucide-vue-next'
import type { ProjectActivityCategory, ProjectActivityStatus } from '@/types/api'

export const ACTIVITY_CATEGORY_ICONS: Record<ProjectActivityCategory, Component> = {
  project: FolderOpen,
  paper: FileText,
  file: FileText,
  task: ListChecks,
  agent: Sparkles,
  export: Archive,
}
export const ACTIVITY_STATUS_ICONS: Record<ProjectActivityStatus, Component> = {
  info: Info,
  queued: Clock3,
  running: LoaderCircle,
  completed: CircleCheck,
  failed: CircleX,
  canceled: CircleDashed,
}
export const ACTIVITY_STATUS_CLASSES: Record<ProjectActivityStatus, string> = {
  info: 'workspace-badge--neutral',
  queued: 'workspace-badge--warning',
  running: 'workspace-badge--info',
  completed: 'workspace-badge--success',
  failed: 'workspace-badge--danger',
  canceled: 'workspace-badge--neutral',
}
