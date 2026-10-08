import type { DataProcessTaskStatus } from '@/types/api'

/**
 * Eligibility rules shared by the single-task drawer and task bulk actions.
 * A task can only be canceled while it is unfinished, retried once it has
 * stopped in a failed/canceled state, and deleted after it has stopped.
 */
export function canCancelTask(status: DataProcessTaskStatus | undefined): boolean {
  return (
    status !== undefined && status !== 'COMPLETED' && status !== 'FAILED' && status !== 'CANCELED'
  )
}

export function canRetryTask(status: DataProcessTaskStatus | undefined): boolean {
  return status === 'FAILED' || status === 'CANCELED'
}

export function canDeleteTask(status: DataProcessTaskStatus | undefined): boolean {
  return (
    status !== undefined && status !== 'QUEUED' && status !== 'RUNNING' && status !== 'CANCELING'
  )
}
