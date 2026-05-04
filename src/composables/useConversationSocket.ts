import { ref, watch } from 'vue'

import { appConfig } from '@/config'
import type {
  ConversationMessageResponse,
  ConversationTurnEventResponse,
  ConversationTurnResponse,
} from '@/types/api'
import { useConversationStore } from '@/stores/conversation'

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export function useConversationSocket(conversationId: string) {
  const chatStore = useConversationStore()
  const ws = ref<WebSocket | null>(null)
  const status = ref<SocketStatus>('idle')
  const isStreaming = ref(false)
  const isToolCalling = ref(false)
  const streamingTurn = ref<ConversationTurnResponse | null>(null)
  const error = ref<string | null>(null)

  const apiUrl = new URL(appConfig.apiBaseUrl)
  const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${wsProtocol}//${apiUrl.host}${apiUrl.pathname}/ws/conversations/${conversationId}`

  function connect(): void {
    if (ws.value?.readyState === WebSocket.OPEN) return

    status.value = 'connecting'
    error.value = null

    const socket = new WebSocket(wsUrl)
    ws.value = socket

    socket.onopen = () => {
      status.value = 'connected'
    }

    socket.onclose = () => {
      status.value = 'disconnected'
      ws.value = null
    }

    socket.onerror = () => {
      status.value = 'error'
      error.value = 'WebSocket connection failed'
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleMessage(data)
      } catch {
        // ignore non-json messages
      }
    }
  }

  function disconnect(): void {
    ws.value?.close()
    ws.value = null
    status.value = 'idle'
    isStreaming.value = false
    isToolCalling.value = false
    streamingTurn.value = null
  }

  function buildUserMessage(raw: unknown): ConversationMessageResponse | null {
    if (!raw || typeof raw !== 'object') return null
    return raw as ConversationMessageResponse
  }

  function ensureStreamingTurn(
    userMessage?: ConversationMessageResponse | null,
  ): ConversationTurnResponse {
    if (streamingTurn.value) return streamingTurn.value
    const nextTurn: ConversationTurnResponse = {
      turn_id: userMessage?.turn_id ?? `pending-${Date.now()}`,
      user_message: userMessage ?? null,
      assistant_events: [],
      trace_ids: [],
    }
    streamingTurn.value = nextTurn
    return nextTurn
  }

  function appendEvent(event: ConversationTurnEventResponse): void {
    const turn = ensureStreamingTurn()
    turn.assistant_events = [...turn.assistant_events, event].sort(
      (a, b) => a.sequence_no - b.sequence_no,
    )
  }

  function updateEventContent(
    eventId: string,
    messageKind: ConversationTurnEventResponse['message_kind'],
    sequenceNo: number,
    delta: string,
  ): void {
    const turn = ensureStreamingTurn()
    const idx = turn.assistant_events.findIndex((item) => item.message_id === eventId)
    if (idx === -1) {
      appendEvent({
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
    nextEvents[idx] = {
      ...nextEvents[idx],
      content: (nextEvents[idx].content ?? '') + delta,
    }
    turn.assistant_events = nextEvents
  }

  function handleMessage(data: Record<string, unknown>): void {
    const type = data.type as string

    switch (type) {
      case 'stream_start': {
        isStreaming.value = true
        isToolCalling.value = false
        chatStore.streamingConversationId = conversationId
        const userMessage = buildUserMessage(data.user_message)
        streamingTurn.value = {
          turn_id: (data.turn_id as string) ?? userMessage?.turn_id ?? '',
          user_message: userMessage,
          assistant_events: [],
          trace_ids: [],
        }
        break
      }

      case 'stream_chunk': {
        const messageId = (data.message_id as string) ?? ''
        const sequenceNo = (data.sequence_no as number) ?? 0
        const messageKind =
          (data.message_kind as ConversationTurnEventResponse['message_kind']) ?? 'assistant_final'
        const delta = ((data.delta as string) ?? '') || ((data.reasoning_delta as string) ?? '')
        if (messageId && delta) {
          updateEventContent(messageId, messageKind, sequenceNo, delta)
        }
        isToolCalling.value = false
        break
      }

      case 'tool_call': {
        isToolCalling.value = true
        appendEvent({
          message_id: (data.message_id as string) ?? '',
          role: 'assistant',
          message_kind: 'assistant_tool_call',
          content: (data.name as string) ?? null,
          name: (data.name as string) ?? null,
          tool_calls: data.tool_call ? [data.tool_call as Record<string, unknown>] : null,
          tool_call_id: null,
          sequence_no: (data.sequence_no as number) ?? 0,
          parent_message_id: null,
          created_at: new Date().toISOString(),
        })
        break
      }

      case 'tool_result': {
        appendEvent({
          message_id: (data.message_id as string) ?? '',
          role: 'tool',
          message_kind: 'tool_result',
          content: (data.content as string) ?? null,
          name: (data.name as string) ?? null,
          tool_calls: null,
          tool_call_id: (data.tool_call_id as string) ?? null,
          sequence_no: (data.sequence_no as number) ?? 0,
          parent_message_id: null,
          created_at: new Date().toISOString(),
        })
        isToolCalling.value = false
        break
      }

      case 'stream_complete': {
        isStreaming.value = false
        isToolCalling.value = false
        chatStore.streamingConversationId = null
        if (streamingTurn.value) {
          streamingTurn.value.trace_ids = (data.trace_ids as string[]) ?? []
          chatStore.upsertTurn({
            ...streamingTurn.value,
            assistant_events: [...streamingTurn.value.assistant_events].sort(
              (a, b) => a.sequence_no - b.sequence_no,
            ),
          })
        }
        break
      }

      case 'error': {
        isStreaming.value = false
        chatStore.streamingConversationId = null
        error.value = (data.detail as string) ?? 'Unknown error'
        break
      }
    }
  }

  function sendMessage(
    content: string,
    messageId?: string,
    images?: string[],
    paperIds?: string[],
  ): void {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      error.value = 'WebSocket not connected'
      return
    }
    error.value = null
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
    ws.value.send(JSON.stringify(payload))
  }

  function stopGeneration(): void {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) return
    ws.value.send(JSON.stringify({ type: 'stop' }))
  }

  watch(
    () => conversationId,
    (newId, oldId) => {
      if (newId !== oldId) {
        disconnect()
      }
    },
  )

  return {
    ws,
    status,
    isStreaming,
    isToolCalling,
    streamingTurn,
    error,
    connect,
    disconnect,
    sendMessage,
    stopGeneration,
  }
}
