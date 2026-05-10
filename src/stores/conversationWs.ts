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
  streamPhase: 'idle' | 'reasoning' | 'tool_calling' | 'finalizing'
  pendingStop: boolean
  completionStatus: 'completed' | 'stopped' | 'error' | null
  lastEventAt: number | null
  streamingTurn: ConversationTurnResponse | null
  error: string | null
  streamingTimeoutId: ReturnType<typeof setTimeout> | null
  reconnectTimeoutId: ReturnType<typeof setTimeout> | null
  shouldReconnect: boolean
  needsRefreshOnReconnect: boolean
}

const STREAMING_TIMEOUT_MS = 120_000
const RECONNECT_DELAY_MS = 1_500

function createInitialState(): ConversationSocketState {
  return {
    status: 'idle',
    isStreaming: false,
    isToolCalling: false,
    streamPhase: 'idle',
    pendingStop: false,
    completionStatus: null,
    lastEventAt: null,
    streamingTurn: null,
    error: null,
    streamingTimeoutId: null,
    reconnectTimeoutId: null,
    shouldReconnect: false,
    needsRefreshOnReconnect: false,
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
      const previousStatus = state.status
      state.status = status
      if (status === 'connected') {
        clearReconnectTimeout(conversationId)
        state.error = null
        if (state.needsRefreshOnReconnect) {
          state.needsRefreshOnReconnect = false
          void chatStore.loadMessages(conversationId).catch(() => {})
        }
        return
      }

      if (status === 'disconnected' || status === 'error') {
        if (state.shouldReconnect) {
          state.needsRefreshOnReconnect =
            state.needsRefreshOnReconnect || state.isStreaming || previousStatus === 'connected'
          scheduleReconnect(conversationId)
          return
        }
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
    const state = ensureState(conversationId)
    state.shouldReconnect = true
    clearReconnectTimeout(conversationId)
    getClient(conversationId).connect()
  }

  function disconnect(conversationId: string): void {
    const state = ensureState(conversationId)
    state.shouldReconnect = false
    state.needsRefreshOnReconnect = false
    clearReconnectTimeout(conversationId)
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
  ): boolean {
    connect(conversationId)
    return getClient(conversationId).sendMessage(content, messageId, images, paperIds)
  }

  function stopGeneration(conversationId: string): boolean {
    const state = ensureState(conversationId)
    state.pendingStop = true
    return clients.value.get(conversationId)?.stopGeneration() ?? false
  }

  /**
   * Switch active conversation: connect new, disconnect stale non-streaming connections.
   */
  function switchActiveConversation(newId: string, previousId?: string | null): void {
    connect(newId)
    if (previousId && previousId !== newId) {
      const prevState = stateMap[previousId]
      if (prevState && !prevState.isStreaming && !prevState.pendingStop) {
        disconnect(previousId)
      }
    }
  }

  function resetStreamingState(conversationId: string): void {
    const state = ensureState(conversationId)
    clearStreamingTimeout(conversationId)
    state.isStreaming = false
    state.isToolCalling = false
    state.streamPhase = 'idle'
    state.pendingStop = false
    state.completionStatus = null
    state.streamingTurn = null
    state.error = null
    state.needsRefreshOnReconnect = false
  }

  function markActivity(conversationId: string): void {
    const state = ensureState(conversationId)
    state.lastEventAt = Date.now()
  }

  function clearStreamingTimeout(conversationId: string): void {
    const state = stateMap[conversationId]
    if (state?.streamingTimeoutId !== null && state?.streamingTimeoutId !== undefined) {
      clearTimeout(state.streamingTimeoutId)
      state.streamingTimeoutId = null
    }
  }

  function clearReconnectTimeout(conversationId: string): void {
    const state = stateMap[conversationId]
    if (state?.reconnectTimeoutId !== null && state?.reconnectTimeoutId !== undefined) {
      clearTimeout(state.reconnectTimeoutId)
      state.reconnectTimeoutId = null
    }
  }

  function scheduleReconnect(conversationId: string): void {
    const state = ensureState(conversationId)
    if (!state.shouldReconnect || state.reconnectTimeoutId) return
    state.reconnectTimeoutId = setTimeout(() => {
      state.reconnectTimeoutId = null
      if (!state.shouldReconnect) return
      getClient(conversationId).connect()
    }, RECONNECT_DELAY_MS)
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
        reasoning_content: messageKind === 'assistant_reasoning' ? delta : null,
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
      reasoning_content:
        messageKind === 'assistant_reasoning'
          ? (nextEvents[eventIndex].reasoning_content ?? nextEvents[eventIndex].content ?? '') +
            delta
          : (nextEvents[eventIndex].reasoning_content ?? null),
    }
    turn.assistant_events = nextEvents
  }

  function handleMessage(conversationId: string, data: ConversationSocketMessage): void {
    const state = ensureState(conversationId)

    switch (data.type) {
      case 'stream_start': {
        markActivity(conversationId)
        state.isStreaming = true
        state.isToolCalling = false
        state.streamPhase = 'reasoning'
        state.pendingStop = false
        state.completionStatus = null
        state.error = null
        state.needsRefreshOnReconnect = false
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
        markActivity(conversationId)
        startStreamingTimeout(conversationId)
        const messageId = data.message_id ?? ''
        const sequenceNo = data.sequence_no ?? 0
        const messageKind = data.message_kind ?? 'assistant_final'
        const delta = data.reasoning_delta || data.delta || ''
        if (messageId && delta) {
          updateEventContent(conversationId, messageId, messageKind, sequenceNo, delta)
        }
        if (messageKind === 'assistant_reasoning') {
          state.streamPhase = 'reasoning'
          state.isToolCalling = false
        } else if (messageKind === 'assistant_final') {
          state.streamPhase = 'finalizing'
          state.isToolCalling = false
        }
        break
      }

      case 'tool_call': {
        markActivity(conversationId)
        startStreamingTimeout(conversationId)
        state.isToolCalling = true
        state.streamPhase = 'tool_calling'
        appendEvent(conversationId, {
          message_id: data.message_id ?? '',
          role: 'assistant',
          message_kind: 'assistant_tool_call',
          content: null,
          reasoning_content: null,
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
        markActivity(conversationId)
        startStreamingTimeout(conversationId)
        appendEvent(conversationId, {
          message_id: data.message_id ?? '',
          role: 'tool',
          message_kind: 'tool_result',
          content: data.content ?? null,
          reasoning_content: null,
          name: data.name ?? null,
          tool_calls: null,
          tool_call_id: data.tool_call_id ?? null,
          sequence_no: data.sequence_no ?? 0,
          parent_message_id: null,
          created_at: new Date().toISOString(),
        })
        state.isToolCalling = true
        state.streamPhase = 'tool_calling'
        break
      }

      case 'stream_complete': {
        markActivity(conversationId)
        clearStreamingTimeout(conversationId)
        state.isStreaming = false
        state.isToolCalling = false
        state.streamPhase = 'idle'
        state.pendingStop = false
        state.completionStatus = data.completion_status ?? 'completed'
        state.needsRefreshOnReconnect = false
        const existingTurnIds = new Set(
          chatStore.currentTurns(conversationId).map((turn) => turn.turn_id),
        )
        const replayedExistingTurn =
          Boolean(state.streamingTurn?.turn_id) &&
          existingTurnIds.has(state.streamingTurn?.turn_id ?? '')
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
        if (replayedExistingTurn) {
          void chatStore.loadMessages(conversationId).catch(() => {})
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
        markActivity(conversationId)
        clearStreamingTimeout(conversationId)
        state.isStreaming = false
        state.isToolCalling = false
        state.streamPhase = 'idle'
        state.pendingStop = false
        state.completionStatus = 'error'
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
