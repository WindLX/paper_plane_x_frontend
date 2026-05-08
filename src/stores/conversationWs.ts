import { defineStore } from 'pinia'
import { reactive, shallowRef } from 'vue'

import {
  conversationApi,
  type ConversationSocketMessage,
  type ConversationSocketStatus,
} from '@/api/conversation'
import type {
  ConversationMessageResponse,
  ConversationTurnEventResponse,
  ConversationTurnResponse,
} from '@/types/api'

import { useConversationStore } from './conversation'

interface ConversationSocketState {
  status: ConversationSocketStatus
  isStreaming: boolean
  isToolCalling: boolean
  streamingTurn: ConversationTurnResponse | null
  error: string | null
  streamingTimeoutId: ReturnType<typeof setTimeout> | null
}

const STREAMING_TIMEOUT_MS = 120_000

function createInitialState(): ConversationSocketState {
  return {
    status: 'idle',
    isStreaming: false,
    isToolCalling: false,
    streamingTurn: null,
    error: null,
    streamingTimeoutId: null,
  }
}

export const useConversationWsStore = defineStore('conversationWs', () => {
  const chatStore = useConversationStore()
  const clients = shallowRef<Map<string, ReturnType<typeof conversationApi.createWebSocketClient>>>(
    new Map(),
  )
  const stateMap = reactive<Record<string, ConversationSocketState>>({})

  function ensureState(conversationId: string): ConversationSocketState {
    stateMap[conversationId] ??= createInitialState()
    return stateMap[conversationId]
  }

  function getState(conversationId: string): ConversationSocketState {
    return ensureState(conversationId)
  }

  function getClient(
    conversationId: string,
  ): ReturnType<typeof conversationApi.createWebSocketClient> {
    const existing = clients.value.get(conversationId)
    if (
      existing &&
      existing.currentStatus !== 'error' &&
      existing.currentStatus !== 'disconnected'
    ) {
      return existing
    }

    const client = conversationApi.createWebSocketClient(conversationId)
    const state = ensureState(conversationId)

    client.onStatusChange((status) => {
      state.status = status
      if (status === 'disconnected' || status === 'error') {
        resetStreamingState(conversationId)
      }
    })

    client.onError((error) => {
      state.error = error
    })

    client.onMessage((message) => {
      handleMessage(conversationId, message)
    })

    clients.value.set(conversationId, client)
    return client
  }

  function connect(conversationId: string): void {
    getClient(conversationId).connect()
  }

  function disconnect(conversationId: string): void {
    clients.value.get(conversationId)?.disconnect()
    clients.value.delete(conversationId)
    stateMap[conversationId] = createInitialState()
  }

  function sendMessage(
    conversationId: string,
    content: string,
    messageId?: string,
    images?: string[],
    paperIds?: string[],
  ): void {
    getClient(conversationId).sendMessage(content, messageId, images, paperIds)
  }

  function stopGeneration(conversationId: string): void {
    resetStreamingState(conversationId)
    clients.value.get(conversationId)?.stopGeneration()
  }

  /**
   * Switch active conversation: connect new, disconnect stale non-streaming connections.
   */
  function switchActiveConversation(newId: string, previousId?: string | null): void {
    connect(newId)
    if (previousId && previousId !== newId) {
      const prevState = stateMap[previousId]
      if (prevState && !prevState.isStreaming) {
        disconnect(previousId)
      }
    }
  }

  function resetStreamingState(conversationId: string): void {
    const state = ensureState(conversationId)
    clearStreamingTimeout(conversationId)
    state.isStreaming = false
    state.isToolCalling = false
    state.streamingTurn = null
    state.error = null
  }

  function clearStreamingTimeout(conversationId: string): void {
    const state = stateMap[conversationId]
    if (state?.streamingTimeoutId !== null && state?.streamingTimeoutId !== undefined) {
      clearTimeout(state.streamingTimeoutId)
      state.streamingTimeoutId = null
    }
  }

  function startStreamingTimeout(conversationId: string): void {
    clearStreamingTimeout(conversationId)
    const state = ensureState(conversationId)
    state.streamingTimeoutId = setTimeout(() => {
      resetStreamingState(conversationId)
    }, STREAMING_TIMEOUT_MS)
  }

  function buildUserMessage(raw: unknown): ConversationMessageResponse | null {
    if (!raw || typeof raw !== 'object') return null
    return raw as ConversationMessageResponse
  }

  function ensureStreamingTurn(
    conversationId: string,
    userMessage?: ConversationMessageResponse | null,
  ): ConversationTurnResponse {
    const state = ensureState(conversationId)
    if (state.streamingTurn) return state.streamingTurn

    const nextTurn: ConversationTurnResponse = {
      turn_id: userMessage?.turn_id ?? `pending-${Date.now()}`,
      user_message: userMessage ?? null,
      assistant_events: [],
      trace_ids: [],
    }
    state.streamingTurn = nextTurn
    return nextTurn
  }

  function appendEvent(conversationId: string, event: ConversationTurnEventResponse): void {
    const turn = ensureStreamingTurn(conversationId)
    turn.assistant_events = [...turn.assistant_events, event].sort(
      (left, right) => left.sequence_no - right.sequence_no,
    )
  }

  function updateEventContent(
    conversationId: string,
    eventId: string,
    messageKind: ConversationTurnEventResponse['message_kind'],
    sequenceNo: number,
    delta: string,
  ): void {
    const turn = ensureStreamingTurn(conversationId)
    const eventIndex = turn.assistant_events.findIndex((item) => item.message_id === eventId)

    if (eventIndex === -1) {
      appendEvent(conversationId, {
        message_id: eventId,
        role: messageKind === 'tool_result' ? 'tool' : 'assistant',
        message_kind: messageKind,
        content: delta,
        name: null,
        tool_calls: null,
        tool_call_id: null,
        sequence_no: sequenceNo,
        parent_message_id: null,
        created_at: new Date().toISOString(),
      })
      return
    }

    const nextEvents = [...turn.assistant_events]
    nextEvents[eventIndex] = {
      ...nextEvents[eventIndex],
      content: (nextEvents[eventIndex].content ?? '') + delta,
    }
    turn.assistant_events = nextEvents
  }

  function handleMessage(conversationId: string, data: ConversationSocketMessage): void {
    const state = ensureState(conversationId)

    switch (data.type) {
      case 'stream_start': {
        state.isStreaming = true
        state.isToolCalling = false
        state.error = null
        startStreamingTimeout(conversationId)
        chatStore.touchConversation(conversationId)
        const userMessage = buildUserMessage(data.user_message)
        state.streamingTurn = {
          turn_id: data.turn_id ?? userMessage?.turn_id ?? '',
          user_message: userMessage,
          assistant_events: [],
          trace_ids: [],
        }
        break
      }

      case 'stream_chunk': {
        startStreamingTimeout(conversationId)
        const messageId = data.message_id ?? ''
        const sequenceNo = data.sequence_no ?? 0
        const messageKind = data.message_kind ?? 'assistant_final'
        const delta = data.delta ?? data.reasoning_delta ?? ''
        if (messageId && delta) {
          updateEventContent(conversationId, messageId, messageKind, sequenceNo, delta)
        }
        state.isToolCalling = false
        break
      }

      case 'tool_call': {
        startStreamingTimeout(conversationId)
        state.isToolCalling = true
        appendEvent(conversationId, {
          message_id: data.message_id ?? '',
          role: 'assistant',
          message_kind: 'assistant_tool_call',
          content: data.name ?? null,
          name: data.name ?? null,
          tool_calls: data.tool_call ? [data.tool_call] : null,
          tool_call_id: null,
          sequence_no: data.sequence_no ?? 0,
          parent_message_id: null,
          created_at: new Date().toISOString(),
        })
        break
      }

      case 'tool_result': {
        startStreamingTimeout(conversationId)
        appendEvent(conversationId, {
          message_id: data.message_id ?? '',
          role: 'tool',
          message_kind: 'tool_result',
          content: data.content ?? null,
          name: data.name ?? null,
          tool_calls: null,
          tool_call_id: data.tool_call_id ?? null,
          sequence_no: data.sequence_no ?? 0,
          parent_message_id: null,
          created_at: new Date().toISOString(),
        })
        state.isToolCalling = false
        break
      }

      case 'stream_complete': {
        clearStreamingTimeout(conversationId)
        state.isStreaming = false
        state.isToolCalling = false
        if (state.streamingTurn) {
          state.streamingTurn.trace_ids = data.trace_ids ?? []
          chatStore.upsertTurn(
            {
              ...state.streamingTurn,
              assistant_events: [...state.streamingTurn.assistant_events].sort(
                (left, right) => left.sequence_no - right.sequence_no,
              ),
            },
            conversationId,
          )
        }
        void conversationApi
          .getConversation(conversationId)
          .then((conversation) => {
            chatStore.syncConversation(conversation)
          })
          .catch(() => {})
        break
      }

      case 'error': {
        clearStreamingTimeout(conversationId)
        state.isStreaming = false
        state.isToolCalling = false
        state.error = data.detail ?? 'Unknown error'
        break
      }
    }
  }

  return {
    connect,
    disconnect,
    switchActiveConversation,
    sendMessage,
    stopGeneration,
    resetStreamingState,
    getState,
  }
})
