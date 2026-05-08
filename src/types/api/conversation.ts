export interface ConversationResponse {
  conversation_id: string
  project_id: string
  title: string
  created_at: string
  updated_at: string
  forked_from_conversation_id: string | null
  forked_at_message_id: string | null
}

export interface ConversationMessageResponse {
  message_id: string
  conversation_id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  name: string | null
  tool_calls: Array<Record<string, unknown>> | null
  tool_call_id: string | null
  sequence_no: number
  turn_id: string | null
  parent_message_id: string | null
  message_kind: string
  trace_ids: string[] | null
  reasoning_content: string | null
  images: string[] | null
  paper_ids: string[] | null
  created_at: string
}

export interface ConversationTurnEventResponse {
  message_id: string
  role: 'assistant' | 'tool'
  message_kind: 'assistant_reasoning' | 'assistant_tool_call' | 'tool_result' | 'assistant_final'
  content: string | null
  reasoning_content?: string | null
  name: string | null
  tool_calls: Array<Record<string, unknown>> | null
  tool_call_id: string | null
  sequence_no: number
  parent_message_id: string | null
  created_at: string
}

export interface ConversationTurnResponse {
  turn_id: string
  user_message: ConversationMessageResponse | null
  assistant_events: ConversationTurnEventResponse[]
  trace_ids: string[]
}

export interface ConversationListResponse {
  items: ConversationResponse[]
  total: number
}

export interface ConversationCreateRequest {
  project_id: string
  title?: string | null
}

export interface ConversationUpdateRequest {
  title: string
}

export interface ConversationForkRequest {
  title?: string | null
  forked_at_message_id?: string | null
}

export interface ConversationMessageCreateRequest {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string | null
  images?: string[] | null
  paper_ids?: string[] | null
}

export interface ConversationMessageUpdateRequest {
  content: string
  images?: string[] | null
  paper_ids?: string[] | null
}
