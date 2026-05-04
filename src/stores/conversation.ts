import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import { api } from '@/api'
import type {
  ConversationMessageResponse,
  ConversationResponse,
  ConversationTurnResponse,
} from '@/types/api'

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<ConversationResponse[]>([])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<ConversationMessageResponse[]>([])
  const turns = ref<ConversationTurnResponse[]>([])
  const loading = ref(false)
  const streamingConversationId = ref<string | null>(null)
  const activeSockets = shallowRef<Map<string, unknown>>(new Map())

  function registerSocket(conversationId: string, socket: unknown): void {
    activeSockets.value.set(conversationId, socket)
  }

  function unregisterSocket(conversationId: string): void {
    activeSockets.value.delete(conversationId)
  }

  function getSocket(conversationId: string): unknown {
    return activeSockets.value.get(conversationId)
  }

  const currentConversation = computed<ConversationResponse | undefined>(() =>
    conversations.value.find((c) => c.conversation_id === currentConversationId.value),
  )

  const projectConversations = computed(() => {
    return (projectId: string) =>
      conversations.value
        .filter((c) => c.project_id === projectId)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  })

  async function loadConversations(projectId: string): Promise<void> {
    loading.value = true
    try {
      const res = await api.listConversations(projectId)
      conversations.value = res.items
    } finally {
      loading.value = false
    }
  }

  async function createConversation(
    projectId: string,
    title?: string,
  ): Promise<ConversationResponse> {
    const res = await api.createConversation({ project_id: projectId, title })
    conversations.value.unshift(res)
    currentConversationId.value = res.conversation_id
    messages.value = []
    turns.value = []
    return res
  }

  async function selectConversation(id: string): Promise<void> {
    currentConversationId.value = id
    messages.value = []
    turns.value = []
    await loadMessages(id)
  }

  async function loadMessages(conversationId: string): Promise<void> {
    loading.value = true
    try {
      const [messageRes, turnRes] = await Promise.all([
        api.listMessages(conversationId),
        api.listTurns(conversationId),
      ])
      messages.value = messageRes
      turns.value = turnRes
    } finally {
      loading.value = false
    }
  }

  async function updateTitle(conversationId: string, title: string): Promise<void> {
    const res = await api.updateConversation(conversationId, { title })
    const idx = conversations.value.findIndex((c) => c.conversation_id === conversationId)
    if (idx !== -1) {
      conversations.value[idx] = res
    }
    if (currentConversation.value?.conversation_id === conversationId) {
      // refresh current
    }
  }

  async function deleteConversation(conversationId: string): Promise<void> {
    await api.deleteConversation(conversationId)
    conversations.value = conversations.value.filter((c) => c.conversation_id !== conversationId)
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = null
      messages.value = []
      turns.value = []
    }
  }

  async function forkConversation(
    conversationId: string,
    title?: string,
    forkedAtMessageId?: string,
  ): Promise<ConversationResponse> {
    const res = await api.forkConversation(conversationId, {
      title,
      forked_at_message_id: forkedAtMessageId ?? null,
    })
    conversations.value.unshift(res)
    currentConversationId.value = res.conversation_id
    messages.value = []
    turns.value = []
    await loadMessages(res.conversation_id)
    return res
  }

  function appendMessage(message: ConversationMessageResponse): void {
    messages.value.push(message)
  }

  function setTurns(nextTurns: ConversationTurnResponse[]): void {
    turns.value = [...nextTurns].sort((a, b) => {
      const aSeq = a.user_message?.sequence_no ?? a.assistant_events[0]?.sequence_no ?? 0
      const bSeq = b.user_message?.sequence_no ?? b.assistant_events[0]?.sequence_no ?? 0
      return aSeq - bSeq
    })
  }

  function upsertTurn(turn: ConversationTurnResponse): void {
    const idx = turns.value.findIndex((item) => item.turn_id === turn.turn_id)
    if (idx === -1) {
      setTurns([...turns.value, turn])
      return
    }
    const next = [...turns.value]
    next[idx] = turn
    setTurns(next)
  }

  async function updateMessage(
    conversationId: string,
    messageId: string,
    content: string,
  ): Promise<void> {
    const res = await api.updateMessage(conversationId, messageId, { content })
    const idx = messages.value.findIndex((m) => m.message_id === messageId)
    if (idx !== -1) {
      messages.value[idx] = res
    }
    if (res.role !== 'user') {
      await loadMessages(conversationId)
      return
    }
    const turnId = res.turn_id
    if (turnId) {
      const turnIdx = turns.value.findIndex((turn) => turn.turn_id === turnId)
      if (turnIdx !== -1 && turns.value[turnIdx].user_message) {
        const nextTurns = [...turns.value]
        nextTurns[turnIdx] = {
          ...nextTurns[turnIdx],
          user_message: res,
          assistant_events: [],
          trace_ids: [],
        }
        setTurns(
          nextTurns.filter(
            (turn) =>
              (turn.user_message?.sequence_no ?? Number.MAX_SAFE_INTEGER) <= res.sequence_no,
          ),
        )
      }
    }
  }

  async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await api.deleteMessage(conversationId, messageId)
    messages.value = messages.value.filter((m) => m.message_id !== messageId)
    turns.value = turns.value.filter(
      (turn) =>
        turn.user_message?.message_id !== messageId &&
        !turn.assistant_events.some((event) => event.message_id === messageId),
    )
  }

  async function deleteTurn(conversationId: string, turnId: string): Promise<void> {
    await api.deleteTurn(conversationId, turnId)
    messages.value = messages.value.filter((message) => message.turn_id !== turnId)
    turns.value = turns.value.filter((turn) => turn.turn_id !== turnId)
  }

  async function renameConversation(conversationId: string, title: string): Promise<void> {
    const res = await api.updateConversation(conversationId, { title })
    const idx = conversations.value.findIndex((c) => c.conversation_id === conversationId)
    if (idx !== -1) {
      conversations.value[idx] = res
    }
  }

  function removeMessagesAfter(messageId: string): void {
    const idx = messages.value.findIndex((m) => m.message_id === messageId)
    if (idx !== -1) {
      messages.value = messages.value.slice(0, idx + 1)
      const cutoff = messages.value[idx]?.sequence_no ?? Number.MAX_SAFE_INTEGER
      turns.value = turns.value.filter(
        (turn) => (turn.user_message?.sequence_no ?? Number.MAX_SAFE_INTEGER) <= cutoff,
      )
    }
  }

  function prepareTurnReplay(userMessageId: string): void {
    const turn = turns.value.find((item) => item.user_message?.message_id === userMessageId)
    if (!turn?.user_message) return

    const cutoff = turn.user_message.sequence_no
    messages.value = messages.value.filter(
      (message) => message.role === 'system' || message.sequence_no <= cutoff,
    )

    turns.value = turns.value
      .filter((item) => (item.user_message?.sequence_no ?? Number.MAX_SAFE_INTEGER) <= cutoff)
      .map((item) =>
        item.turn_id === turn.turn_id
          ? {
              ...item,
              assistant_events: [],
              trace_ids: [],
            }
          : item,
      )
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    turns,
    loading,
    streamingConversationId,
    activeSockets,
    projectConversations,
    loadConversations,
    createConversation,
    selectConversation,
    loadMessages,
    updateTitle,
    deleteConversation,
    forkConversation,
    renameConversation,
    updateMessage,
    deleteMessage,
    deleteTurn,
    appendMessage,
    setTurns,
    upsertTurn,
    removeMessagesAfter,
    prepareTurnReplay,
    registerSocket,
    unregisterSocket,
    getSocket,
  }
})
