import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import type { DataProcessTaskResponse } from '@/types/api'

import { useTaskBulkActions, type TaskBulkRun } from './useTaskBulkActions'

const apiMock = vi.hoisted(() => ({
  getTask: vi.fn(),
  cancelTask: vi.fn(),
  retryTask: vi.fn(),
  deleteTask: vi.fn(),
}))

vi.mock('@/api', () => ({ api: apiMock }))

function makeTask(overrides: Partial<DataProcessTaskResponse> = {}): DataProcessTaskResponse {
  return {
    task_id: 't1',
    paper_id: 'p1',
    status: 'RUNNING',
    created_at: '2026-01-01T00:00:00Z',
    started_at: null,
    finished_at: null,
    error: null,
    retry_of_task_id: null,
    extraction_trace_ids: [],
    analysis_trace_ids: [],
    extraction_fact_check_trace_ids: [],
    analysis_fact_check_trace_ids: [],
    ...overrides,
  }
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function createBulk() {
  const scope = effectScope()
  const bulk = scope.run(() => useTaskBulkActions())
  if (!bulk) throw new Error('effect scope did not create the bulk controller')
  return { bulk, stop: () => scope.stop() }
}

async function runOrFail(run: Promise<TaskBulkRun | null>): Promise<TaskBulkRun> {
  const outcome = await run
  if (outcome === null) throw new Error('bulk run did not start')
  return outcome
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTaskBulkActions', () => {
  it('reads every task fresh and skips statuses that do not allow the action', async () => {
    apiMock.getTask.mockImplementation(async (taskId: string) =>
      makeTask({ task_id: taskId, status: taskId === 'running' ? 'RUNNING' : 'COMPLETED' }),
    )
    apiMock.cancelTask.mockImplementation(async (taskId: string) =>
      makeTask({ task_id: taskId, status: 'CANCELED' }),
    )

    const { bulk, stop } = createBulk()
    const outcome = await runOrFail(bulk.execute('cancel', ['running', 'done']))

    expect(apiMock.getTask).toHaveBeenCalledTimes(2)
    expect(apiMock.getTask.mock.calls.map((call) => call[0])).toEqual(['running', 'done'])
    expect(apiMock.cancelTask).toHaveBeenCalledTimes(1)
    expect(apiMock.cancelTask).toHaveBeenCalledWith('running')
    expect(outcome.map((entry) => entry.status)).toEqual(['success', 'skipped'])
    expect(outcome[1].reason).toEqual({ kind: 'ineligible', code: 'status-mismatch' })
    stop()
  })

  it('keeps the new task id returned by retry', async () => {
    apiMock.getTask.mockResolvedValue(makeTask({ task_id: 't1', status: 'FAILED' }))
    apiMock.retryTask.mockResolvedValue(makeTask({ task_id: 't1-retry', status: 'QUEUED' }))

    const { bulk, stop } = createBulk()
    const outcome = await runOrFail(bulk.execute('retry', ['t1']))

    expect(apiMock.retryTask).toHaveBeenCalledWith('t1')
    expect(outcome[0].result?.task_id).toBe('t1-retry')
    expect(bulk.rows[0].extra).toContain('t1-retry')
    stop()
  })

  it('continues after a failed item and reports its reason', async () => {
    apiMock.getTask.mockImplementation(async (taskId: string) =>
      makeTask({ task_id: taskId, status: 'RUNNING' }),
    )
    apiMock.cancelTask.mockImplementation(async (taskId: string) => {
      if (taskId === 't2') throw new Error('cancel rejected')
      return makeTask({ task_id: taskId, status: 'CANCELED' })
    })

    const { bulk, stop } = createBulk()
    const outcome = await runOrFail(bulk.execute('cancel', ['t1', 't2', 't3']))

    expect(outcome.map((entry) => entry.status)).toEqual(['success', 'failed', 'success'])
    expect(outcome[1].reason).toEqual({ kind: 'error', message: 'cancel rejected' })
    expect(apiMock.cancelTask).toHaveBeenCalledTimes(3)
    stop()
  })

  it('runs at most three fresh reads in parallel', async () => {
    const gates = new Map<string, () => void>()
    let active = 0
    let maxActive = 0

    apiMock.getTask.mockImplementation(async (taskId: string) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise<void>((resolve) => gates.set(taskId, resolve))
      active -= 1
      return makeTask({ task_id: taskId, status: 'RUNNING' })
    })
    apiMock.cancelTask.mockImplementation(async (taskId: string) =>
      makeTask({ task_id: taskId, status: 'CANCELED' }),
    )

    const { bulk, stop } = createBulk()
    const run = bulk.execute('cancel', ['1', '2', '3', '4', '5', '6', '7'])
    expect(gates.size).toBe(3)

    while (gates.size > 0) {
      const releases = [...gates.values()]
      gates.clear()
      releases.forEach((release) => release())
      await flush()
    }

    const outcome = await runOrFail(run)
    expect(maxActive).toBe(3)
    expect(outcome).toHaveLength(7)
    expect(apiMock.cancelTask).toHaveBeenCalledTimes(7)
    stop()
  })

  it('does not start further writes once the scope is disposed', async () => {
    const gates = new Map<string, () => void>()
    apiMock.getTask.mockImplementation(async (taskId: string) => {
      await new Promise<void>((resolve) => gates.set(taskId, resolve))
      return makeTask({ task_id: taskId, status: 'RUNNING' })
    })
    apiMock.cancelTask.mockImplementation(async (taskId: string) =>
      makeTask({ task_id: taskId, status: 'CANCELED' }),
    )

    const { bulk, stop } = createBulk()
    const run = bulk.execute('cancel', ['1', '2', '3', '4', '5', '6'])
    expect(gates.size).toBe(3)

    stop()
    const releases = [...gates.values()]
    gates.clear()
    releases.forEach((release) => release())
    await flush()

    const outcome = await runOrFail(run)
    expect(outcome).toEqual([])
    expect(bulk.rows).toEqual([])
    expect(apiMock.getTask).toHaveBeenCalledTimes(3)
    expect(apiMock.cancelTask).not.toHaveBeenCalled()
  })
})
