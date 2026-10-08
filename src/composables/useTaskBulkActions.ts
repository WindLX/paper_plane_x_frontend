import { computed, onScopeDispose, reactive, ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type { DataProcessTaskResponse, DataProcessTaskStatus } from '@/types/api'
import {
  bulkAborted,
  bulkSkip,
  bulkSuccess,
  runBulk,
  toDisplayRows,
  type BulkDisplayRow,
  type BulkItemResult,
  type BulkOutcome,
} from '@/utils/bulkRunner'
import { canCancelTask, canDeleteTask, canRetryTask } from '@/utils/taskActions'

import { invalidateTaskCache } from './useTasksController'

export type TaskBulkAction = 'cancel' | 'retry' | 'delete'

export type TaskBulkRun = Array<BulkItemResult<string, DataProcessTaskResponse | null>>

function isEligible(action: TaskBulkAction, status: DataProcessTaskStatus): boolean {
  if (action === 'cancel') return canCancelTask(status)
  if (action === 'retry') return canRetryTask(status)
  return canDeleteTask(status)
}

/**
 * Runs cancel/retry/delete over a set of task ids with a fresh eligibility read
 * per task. Failures land in the per-item results instead of aborting the batch.
 */
export function useTaskBulkActions() {
  const running = ref(false)
  const results = ref<TaskBulkRun>([])
  const controller = new AbortController()

  onScopeDispose(() => {
    controller.abort()
  })

  const rows = computed<BulkDisplayRow[]>(() =>
    toDisplayRows(
      results.value,
      (taskId) => taskId,
      (entry) =>
        entry.status === 'success' && entry.result && entry.result.task_id !== entry.item
          ? translate('bulk.results.newTaskId', { taskId: entry.result.task_id })
          : null,
    ),
  )

  async function perform(
    action: TaskBulkAction,
    taskId: string,
  ): Promise<BulkOutcome<DataProcessTaskResponse | null>> {
    // Fresh read: the list may be stale, and the backend is the source of truth.
    const task = await api.getTask(taskId)
    // The scope may have been disposed while the read was in flight.
    if (controller.signal.aborted) return bulkAborted()
    if (!isEligible(action, task.status)) return bulkSkip('status-mismatch')

    if (action === 'cancel') {
      return bulkSuccess(await api.cancelTask(taskId))
    }
    if (action === 'retry') {
      return bulkSuccess(await api.retryTask(taskId))
    }
    await api.deleteTask(taskId)
    return bulkSuccess(null)
  }

  async function execute(action: TaskBulkAction, taskIds: string[]): Promise<TaskBulkRun | null> {
    if (running.value || taskIds.length === 0) return null
    running.value = true
    results.value = []
    try {
      const outcome = await runBulk(taskIds, (taskId) => perform(action, taskId), {
        signal: controller.signal,
      })
      for (const entry of outcome) {
        if (entry.status === 'success') invalidateTaskCache(entry.item)
      }
      if (controller.signal.aborted) return outcome
      results.value = outcome
      return outcome
    } finally {
      running.value = false
    }
  }

  function clearResults(): void {
    results.value = []
  }

  return reactive({
    running,
    results,
    rows,
    execute,
    clearResults,
  })
}
