import { request } from './core'
import { BaseWebSocketClient, type WebSocketStatus } from './ws'
import type {
  ConversationCreateRequest,
  ConversationForkRequest,
  ConversationListResponse,
  ConversationMessageCreateRequest,
  ConversationMessageResponse,
  ConversationMessageUpdateRequest,
  ConversationTurnEventResponse,
  ConversationTurnResponse,
  ConversationResponse,
  ConversationUpdateRequest,
} from '../types/api'

export type ConversationSocketStatus = WebSocketStatus

export interface ConversationSocketMessage {
  type: 'stream_start' | 'stream_chunk' | 'tool_call' | 'tool_result' | 'stream_complete' | 'error'
  turn_id?: string
  user_message?: ConversationMessageResponse
  message_id?: string
  sequence_no?: number
  message_kind?: ConversationTurnEventResponse['message_kind']
  delta?: string
  reasoning_delta?: string
  name?: string | null
  tool_call?: Record<string, unknown>
  tool_call_id?: string | null
  content?: string | null
  trace_ids?: string[]
  detail?: string
}

export class ConversationWebSocketClient extends BaseWebSocketClient<ConversationSocketMessage> {
  private readonly conversationId: string

  constructor(conversationId: string) {
    super({
      path: `/ws/conversations/${conversationId}`,
    })
    this.conversationId = conversationId
  }

  sendMessage(content: string, messageId?: string, images?: string[], paperIds?: string[]): void {
    const payload: Record<string, unknown> = {
      type: 'user_message',
      content,
      message_id: messageId ?? undefined,
    }
    if (images && images.length > 0) {
      payload.images = images
    }
    if (paperIds && paperIds.length > 0) {
      payload.paper_ids = paperIds
    }
    this.sendJson(payload)
  }

  stopGeneration(): void {
    this.sendJson({ type: 'stop' })
  }

  get id(): string {
    return this.conversationId
  }
}

export const conversationApi = {
  listConversations(projectId: string): Promise<ConversationListResponse> {
    return request(`/conversations?project_id=${encodeURIComponent(projectId)}`)
  },

  createConversation(payload: ConversationCreateRequest): Promise<ConversationResponse> {
    return request('/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getConversation(conversationId: string): Promise<ConversationResponse> {
    return request(`/conversations/${conversationId}`)
  },

  updateConversation(
    conversationId: string,
    payload: ConversationUpdateRequest,
  ): Promise<ConversationResponse> {
    return request(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deleteConversation(conversationId: string): Promise<void> {
    return request(`/conversations/${conversationId}`, { method: 'DELETE' })
  },

  forkConversation(
    conversationId: string,
    payload?: ConversationForkRequest,
  ): Promise<ConversationResponse> {
    return request(`/conversations/${conversationId}/fork`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    })
  },

  listMessages(conversationId: string): Promise<ConversationMessageResponse[]> {
    return request(`/conversations/${conversationId}/messages`)
  },

  listTurns(conversationId: string): Promise<ConversationTurnResponse[]> {
    return request(`/conversations/${conversationId}/turns`)
  },

  createMessage(
    conversationId: string,
    payload: ConversationMessageCreateRequest,
  ): Promise<ConversationMessageResponse> {
    return request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateMessage(
    conversationId: string,
    messageId: string,
    payload: ConversationMessageUpdateRequest,
  ): Promise<ConversationMessageResponse> {
    return request(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deleteMessage(conversationId: string, messageId: string): Promise<void> {
    return request(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    })
  },

  deleteTurn(conversationId: string, turnId: string): Promise<void> {
    return request(`/conversations/${conversationId}/turns/${turnId}`, {
      method: 'DELETE',
    })
  },

  createWebSocketClient(conversationId: string): ConversationWebSocketClient {
    return new ConversationWebSocketClient(conversationId)
  },
}
