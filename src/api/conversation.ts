import { request } from './core'
import type {
  ConversationCreateRequest,
  ConversationForkRequest,
  ConversationListResponse,
  ConversationMessageCreateRequest,
  ConversationMessageResponse,
  ConversationMessageUpdateRequest,
  ConversationTurnResponse,
  ConversationResponse,
  ConversationUpdateRequest,
} from '../types/api'

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
}
