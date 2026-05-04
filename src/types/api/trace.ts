export interface AgentTraceResponse {
  trace_id: string
  agent_name: string
  messages: TraceMessage[]
  llm_model: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  usage_payload: Record<string, unknown> | null
  tools: Array<Record<string, unknown>> | null
  created_at: string
  caller: string | null
  caller_id: string | null
}

export interface AgentTraceQueryResponse {
  items: AgentTraceResponse[]
}

export interface AgentTraceListRequest {
  offset?: number
  limit?: number
  sort_by?: string
  sort_order?: string
  agent_name?: string | null
  caller?: string | null
  caller_id?: string | null
  llm_model?: string | null
  created_at_from?: string | null
  created_at_to?: string | null
}

export interface AgentTraceStats {
  agent_name_counts: Record<string, number>
}

export interface AgentTraceListResponse {
  offset: number
  limit: number
  total: number
  items: AgentTraceResponse[]
  stats: AgentTraceStats
}

export type TraceMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | unknown[] | null
  reasoning_content?: string | null
  name?: string | null
  tool_calls?: unknown[] | null
  tool_call_id?: string | null
}
