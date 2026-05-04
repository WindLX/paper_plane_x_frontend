import { defineStore } from 'pinia'
import { ref } from 'vue'

import { translate } from '../i18n'
import { api } from '@/api'
import { usePagination } from '@/composables/usePagination'
import type { AgentTraceListResponse, AgentTraceResponse, AgentTraceStats } from '@/types/api'
import type { TraceSortKey } from '@/types/sort'

export const useTraceStore = defineStore('traces', () => {
  const traces = ref<Record<string, AgentTraceResponse>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<AgentTraceStats | null>(null)

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
      for (const trace of payload.items) {
        traces.value[trace.trace_id] = trace
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('errors.fetchTraces')
    } finally {
      loading.value = false
    }
  }

  async function fetchByIds(traceIds: string[]): Promise<void> {
    const pendingIds = traceIds.filter((traceId) => traces.value[traceId] === undefined)
    if (pendingIds.length === 0) {
      return
    }
    loading.value = true
    error.value = null
    try {
      const payload = await api.queryAgentTraces(pendingIds)
      for (const trace of payload.items) {
        traces.value[trace.trace_id] = trace
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('errors.fetchTraces')
    } finally {
      loading.value = false
    }
  }

  function getByIds(traceIds: string[]): AgentTraceResponse[] {
    return traceIds
      .map((traceId) => traces.value[traceId])
      .filter((item): item is AgentTraceResponse => item !== undefined)
  }

  function getById(traceId: string): AgentTraceResponse | undefined {
    return traces.value[traceId]
  }

  async function deleteById(traceId: string): Promise<void> {
    await api.deleteAgentTrace(traceId)
    delete traces.value[traceId]
  }

  return {
    traces,
    loading,
    error,
    stats,
    items: paginated.items,
    total: paginated.total,
    offset: paginated.offset,
    limit: paginated.limit,
    sortOrder: paginated.sortOrder,
    sortBy: paginated.sortBy,
    totalPages: paginated.totalPages,
    currentPage: paginated.currentPage,
    hasPrevPage: paginated.hasPrevPage,
    hasNextPage: paginated.hasNextPage,
    setPage: paginated.setPage,
    nextPage: paginated.nextPage,
    prevPage: paginated.prevPage,
    setLimit: paginated.setLimit,
    toggleSort: paginated.toggleSort,
    fetchTraces,
    fetchByIds,
    getByIds,
    getById,
    deleteById,
  }
})
