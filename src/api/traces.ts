import { request } from './core'
import type {
  AgentTraceListRequest,
  AgentTraceListResponse,
  AgentTraceQueryResponse,
} from '../types/api'

export const tracesApi = {
  listAgentTraces(payload: AgentTraceListRequest): Promise<AgentTraceListResponse> {
    return request('/agent-traces/list', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  queryAgentTraces(traceIds: string[]): Promise<AgentTraceQueryResponse> {
    return request('/agent-traces/query', {
      method: 'POST',
      body: JSON.stringify({ trace_ids: traceIds }),
    })
  },

  deleteAgentTrace(traceId: string): Promise<{ message: string }> {
    return request(`/agent-traces/${traceId}`, { method: 'DELETE' })
  },
}
