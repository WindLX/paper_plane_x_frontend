import {
  computed,
  markRaw,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
  type Ref,
} from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type {
  AgentTraceResponse,
  DataProcessTaskListResponse,
  DataProcessTaskResponse,
} from '@/types/api'
import type { TaskSortKey } from '@/types/sort'

import { usePagination } from './usePagination'
import { useNotify } from './useNotify'

export function useTaskList() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notify = useNotify()

  const queued = ref(0)
  const running = ref(0)
  const completed = ref(0)
  const failed = ref(0)
  const canceled = ref(0)

  const paginated = usePagination<
    DataProcessTaskResponse,
    TaskSortKey,
    DataProcessTaskListResponse
  >({
    fetcher: ({ offset, limit, sortOrder, sortBy }) =>
      api.listTasks(offset, limit, sortOrder, sortBy),
    defaultLimit: 20,
  })

  async function fetchTasks(options?: Parameters<typeof paginated.fetch>[0]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const payload = await paginated.fetch(options)
      queued.value = payload.queued
      running.value = payload.running
      completed.value = payload.completed
      failed.value = payload.failed
      canceled.value = payload.canceled
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('tasks.errors.fetchTasks')
      notify.push(error.value, 'error', 3600)
    } finally {
      loading.value = false
    }
  }

  return reactive({
    loading,
    error,
    queued,
    running,
    completed,
    failed,
    canceled,
    paginated,
    fetchTasks,
  })
}

export interface TraceSection {
  key: string
  title: string
  ids: string[]
  entries: Array<{ traceId: string; trace: AgentTraceResponse | null; loading: boolean }>
}

type TraceEntry = TraceSection['entries'][number]

/* ── Task detail cache ──────────────────────────────────────────── */

const MAX_CACHED_TASKS = 5

interface CachedTask {
  task: DataProcessTaskResponse
  traces: Record<string, AgentTraceResponse>
}

const taskCache = new Map<string, CachedTask>()
const taskCacheOrder: string[] = []

function cacheTask(taskId: string, data: CachedTask): void {
  // evict oldest if at capacity
  if (!taskCache.has(taskId) && taskCache.size >= MAX_CACHED_TASKS) {
    const oldest = taskCacheOrder.shift()
    if (oldest) taskCache.delete(oldest)
  }
  // move to end (most recent)
  const idx = taskCacheOrder.indexOf(taskId)
  if (idx !== -1) taskCacheOrder.splice(idx, 1)
  taskCacheOrder.push(taskId)
  taskCache.set(taskId, data)
}

function invalidateTaskCache(taskId: string): void {
  taskCache.delete(taskId)
  const idx = taskCacheOrder.indexOf(taskId)
  if (idx !== -1) taskCacheOrder.splice(idx, 1)
}

function collectTaskTraceIds(task: DataProcessTaskResponse): string[] {
  return [
    ...task.extraction_trace_ids,
    ...task.analysis_trace_ids,
    ...task.extraction_fact_check_trace_ids,
    ...task.analysis_fact_check_trace_ids,
  ]
}

function buildTraceSections(
  task: DataProcessTaskResponse,
  traces: Record<string, AgentTraceResponse>,
): { sections: TraceSection[]; entryMap: Map<string, TraceEntry> } {
  const entryMap = new Map<string, TraceEntry>()

  const createEntries = (ids: string[]): TraceEntry[] =>
    ids.map((traceId) => {
      const entry: TraceEntry = {
        traceId,
        trace: traces[traceId] ?? null,
        loading: false,
      }
      entryMap.set(traceId, entry)
      return entry
    })

  return {
    sections: [
      {
        key: 'extraction',
        title: 'Extraction',
        ids: task.extraction_trace_ids,
        entries: createEntries(task.extraction_trace_ids),
      },
      {
        key: 'extraction_fact_check',
        title: 'Extraction Fact Check',
        ids: task.extraction_fact_check_trace_ids,
        entries: createEntries(task.extraction_fact_check_trace_ids),
      },
      {
        key: 'analysis',
        title: 'Analysis',
        ids: task.analysis_trace_ids,
        entries: createEntries(task.analysis_trace_ids),
      },
      {
        key: 'analysis_fact_check',
        title: 'Analysis Fact Check',
        ids: task.analysis_fact_check_trace_ids,
        entries: createEntries(task.analysis_fact_check_trace_ids),
      },
    ],
    entryMap,
  }
}

async function yieldToBrowser(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve())
      return
    }
    setTimeout(resolve, 0)
  })
}

/* ── useTaskDetail ─────────────────────────────────────────────── */

export function useTaskDetail(taskId: Ref<string | null>) {
  const task = shallowRef<DataProcessTaskResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notify = useNotify()

  const traceSections = shallowRef<TraceSection[]>([])
  let traceMap: Record<string, AgentTraceResponse> = {}
  let traceEntryMap = new Map<string, TraceEntry>()
  let traceAbortFlag = 0

  onBeforeUnmount(() => {
    traceAbortFlag++
  })

  // 状态判断
  const canCancel = computed(
    () =>
      task.value?.status !== 'COMPLETED' &&
      task.value?.status !== 'FAILED' &&
      task.value?.status !== 'CANCELED',
  )
  const canRetry = computed(
    () => task.value?.status === 'FAILED' || task.value?.status === 'CANCELED',
  )
  const canDelete = computed(
    () =>
      task.value?.status !== 'QUEUED' &&
      task.value?.status !== 'RUNNING' &&
      task.value?.status !== 'CANCELING',
  )

  function resetDetailState() {
    task.value = null
    error.value = null
    traceMap = {}
    traceEntryMap = new Map()
    traceSections.value = []
  }

  function applyTaskDetail(
    nextTask: DataProcessTaskResponse,
    traces: Record<string, AgentTraceResponse> = {},
  ): void {
    const rawTask = markRaw(nextTask)
    const nextTraces: Record<string, AgentTraceResponse> = {}
    for (const [traceId, trace] of Object.entries(traces)) {
      nextTraces[traceId] = markRaw(trace)
    }

    const { sections, entryMap } = buildTraceSections(rawTask, nextTraces)
    task.value = rawTask
    traceMap = nextTraces
    traceEntryMap = entryMap
    traceSections.value = sections
  }

  function refreshTraceSections(): void {
    traceSections.value = [...traceSections.value]
  }

  async function loadTask() {
    if (!taskId.value) {
      traceAbortFlag++
      resetDetailState()
      return
    }

    // 1. try cache first
    const cached = taskCache.get(taskId.value)
    if (cached) {
      applyTaskDetail(cached.task, cached.traces)
      loading.value = false
      error.value = null
      // move to most-recently-used
      const idx = taskCacheOrder.indexOf(taskId.value)
      if (idx !== -1) taskCacheOrder.splice(idx, 1)
      taskCacheOrder.push(taskId.value)
      return
    }

    // 2. fetch from backend
    traceAbortFlag++
    const myFlag = traceAbortFlag

    loading.value = true
    error.value = null
    try {
      const fetched = await api.getTask(taskId.value)
      if (myFlag !== traceAbortFlag) return
      applyTaskDetail(fetched)
      loading.value = false
      startTraceLoading(myFlag)
    } catch (err) {
      if (myFlag !== traceAbortFlag) return
      error.value = err instanceof Error ? err.message : translate('tasks.detail.errors.getTask')
      notify.push(error.value, 'error', 3600)
      loading.value = false
    }
  }

  async function startTraceLoading(myFlag: number) {
    if (!task.value) return
    const ids = collectTaskTraceIds(task.value)
    if (ids.length === 0) {
      // no traces to load → cache immediately
      cacheTask(task.value.task_id, { task: task.value, traces: {} })
      return
    }

    const pending = ids.filter((id) => !traceMap[id])
    if (pending.length === 0) {
      cacheTask(task.value.task_id, { task: task.value, traces: { ...traceMap } })
      return
    }

    for (const id of pending) {
      const entry = traceEntryMap.get(id)
      if (entry) {
        entry.loading = true
      }
    }
    refreshTraceSections()
    await yieldToBrowser()

    for (let i = 0; i < pending.length; i += 5) {
      if (myFlag !== traceAbortFlag) return
      const batch = pending.slice(i, i + 5)
      try {
        const res = await api.queryAgentTraces(batch)
        if (myFlag !== traceAbortFlag) return
        for (const trace of res.items) {
          const rawTrace = markRaw(trace)
          traceMap[rawTrace.trace_id] = rawTrace
          const entry = traceEntryMap.get(rawTrace.trace_id)
          if (entry) {
            entry.trace = rawTrace
            entry.loading = false
          }
        }
      } catch {
        // ignore individual batch failures
      } finally {
        for (const id of batch) {
          const entry = traceEntryMap.get(id)
          if (entry) {
            entry.loading = false
          }
        }
        refreshTraceSections()
      }
      if (myFlag !== traceAbortFlag) return
      await yieldToBrowser()
    }

    // all batches done → cache
    if (myFlag === traceAbortFlag && task.value) {
      cacheTask(task.value.task_id, { task: task.value, traces: { ...traceMap } })
    }
  }

  async function cancel(): Promise<boolean> {
    if (!task.value) return false
    try {
      await api.cancelTask(task.value.task_id)
      invalidateTaskCache(task.value.task_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : translate('tasks.detail.errors.cancelTask')
      notify.push(msg, 'error', 3600)
      return false
    }
    await loadTask()
    return true
  }

  async function retry(): Promise<boolean> {
    if (!task.value) return false
    try {
      await api.retryTask(task.value.task_id)
      invalidateTaskCache(task.value.task_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : translate('tasks.detail.errors.retryTask')
      notify.push(msg, 'error', 3600)
      return false
    }
    await loadTask()
    return true
  }

  async function remove(): Promise<boolean> {
    if (!task.value) return false
    try {
      await api.deleteTask(task.value.task_id)
      invalidateTaskCache(task.value.task_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : translate('tasks.detail.errors.deleteTask')
      notify.push(msg, 'error', 3600)
      return false
    }
    return true
  }

  // taskId 变化时自动加载
  watch(taskId, loadTask, { immediate: true })

  return reactive({
    task,
    loading,
    error,
    traceSections,
    canCancel,
    canRetry,
    canDelete,
    loadTask,
    cancel,
    retry,
    remove,
  })
}
