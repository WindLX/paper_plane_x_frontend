import { computed, reactive, ref, watch, type Ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type { AgentTraceListResponse, AgentTraceResponse } from '@/types/api'
import type { TraceSortKey } from '@/types/sort'

import { useNotify } from './useNotify'
import { usePagination } from './usePagination'

export type TraceListController = ReturnType<typeof useTraceList>
export type TraceDetailController = ReturnType<typeof useTraceDetail>

export function useTraceList() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<AgentTraceListResponse['stats'] | null>(null)

  const paginated = usePagination<AgentTraceResponse, TraceSortKey, AgentTraceListResponse>({
    fetcher: ({ offset, limit, sortOrder, sortBy }) =>
      api.listAgentTraces({
        offset,
        limit,
        sort_order: sortOrder === 'default' ? undefined : sortOrder,
        sort_by: sortBy ?? undefined,
      }),
    defaultLimit: 20,
  })

  async function fetchTraces(options?: Parameters<typeof paginated.fetch>[0]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const payload = await paginated.fetch(options)
      stats.value = payload.stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('traces.errors.fetchTraces')
    } finally {
      loading.value = false
    }
  }

  return reactive({
    loading,
    error,
    stats,
    paginated,
    fetchTraces,
  })
}

export function useTraceDetail(traceId: Ref<string | null>) {
  const trace = ref<AgentTraceResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notify = useNotify()

  const hasTrace = computed(() => trace.value !== null)

  async function loadTrace() {
    if (!traceId.value) {
      trace.value = null
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const res = await api.queryAgentTraces([traceId.value])
      trace.value = res.items[0] ?? null
      if (!trace.value) {
        error.value = translate('traces.notFound')
      }
    } catch (err) {
      trace.value = null
      error.value =
        err instanceof Error ? err.message : translate('traces.detail.error.queryAgentTraces')
      notify.push(error.value, 'error', 3600)
    } finally {
      loading.value = false
    }
  }

  async function remove(): Promise<boolean> {
    if (!traceId.value) return false
    try {
      await api.deleteAgentTrace(traceId.value)
      return true
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : translate('traces.detail.error.deleteAgentTrace')
      error.value = msg
      notify.push(msg, 'error', 3600)
      return false
    }
  }

  watch(traceId, loadTrace, { immediate: true })

  return reactive({
    trace,
    loading,
    error,
    hasTrace,
    loadTrace,
    remove,
  })
}
