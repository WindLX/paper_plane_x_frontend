import { defineStore } from 'pinia'
import { ref } from 'vue'

import { translate } from '../i18n'
import { api } from '../api/client'
import type { AgentTraceResponse } from '../types/api'

export const useTraceStore = defineStore('traces', () => {
  const traces = ref<Record<string, AgentTraceResponse>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

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
    fetchByIds,
    getByIds,
    getById,
    deleteById,
  }
})
