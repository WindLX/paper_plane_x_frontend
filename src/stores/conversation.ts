import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

import { api } from '@/api'
import { useProjectStore } from '@/stores/projects'
import type {
  ConversationMessageResponse,
  ConversationResponse,
  ConversationTurnResponse,
} from '@/types/api'

function sortConversations(
  conversationIds: string[],
  conversationsById: Record<string, ConversationResponse>,
): string[] {
  return [...conversationIds].sort((leftId, rightId) => {
    const left = conversationsById[leftId]
    const right = conversationsById[rightId]
    if (!left && !right) return 0
    if (!left) return 1
    if (!right) return -1
    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  })
}

export const useConversationStore = defineStore('conversation', () => {
  const projectStore = useProjectStore()

  const conversationsByProjectId = reactive<Record<string, string[]>>({})
  const conversationsById = reactive<Record<string, ConversationResponse>>({})
  const messagesByConversationId = reactive<Record<string, ConversationMessageResponse[]>>({})
  const turnsByConversationId = reactive<Record<string, ConversationTurnResponse[]>>({})

  const currentConversationId = ref<string | null>(null)
  const loadingProjectLists = reactive<Record<string, boolean>>({})
  const loadingConversationContent = reactive<Record<string, boolean>>({})

  const loading = computed(
    () =>
      Object.values(loadingProjectLists).some(Boolean) ||
      Object.values(loadingConversationContent).some(Boolean),
  )

  const currentConversation = computed<ConversationResponse | undefined>(() =>
    currentConversationId.value ? conversationsById[currentConversationId.value] : undefined,
  )

  const messages = computed<ConversationMessageResponse[]>(() =>
    currentConversationId.value
      ? (messagesByConversationId[currentConversationId.value] ?? [])
      : [],
  )

  const turns = computed<ConversationTurnResponse[]>(() =>
    currentConversationId.value ? (turnsByConversationId[currentConversationId.value] ?? []) : [],
  )

  function setProjectConversationIds(projectId: string, conversationIds: string[]): void {
    conversationsByProjectId[projectId] = sortConversations(conversationIds, conversationsById)
  }

  function syncConversation(conversation: ConversationResponse): ConversationResponse {
    conversationsById[conversation.conversation_id] = conversation
    const currentIds = conversationsByProjectId[conversation.project_id] ?? []
    if (!currentIds.includes(conversation.conversation_id)) {
      conversationsByProjectId[conversation.project_id] = [
        conversation.conversation_id,
        ...currentIds,
      ]
    }
    setProjectConversationIds(
      conversation.project_id,
      conversationsByProjectId[conversation.project_id],
    )
    return conversation
  }

  function touchConversation(
    conversationId: string,
    patch: Partial<ConversationResponse> = {},
  ): void {
    const existing = conversationsById[conversationId]
    if (!existing) return
    syncConversation({
      ...existing,
      ...patch,
      updated_at: patch.updated_at ?? new Date().toISOString(),
    })
  }

  function removeConversationEntity(conversationId: string): void {
    const conversation = conversationsById[conversationId]
    if (conversation) {
      const projectId = conversation.project_id
      conversationsByProjectId[projectId] = (conversationsByProjectId[projectId] ?? []).filter(
        (id) => id !== conversationId,
      )
      delete conversationsById[conversationId]
    }
    delete messagesByConversationId[conversationId]
    delete turnsByConversationId[conversationId]
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = null
    }
  }

  function clearCurrentConversation(): void {
    currentConversationId.value = null
  }

  function projectConversations(projectId: string): ConversationResponse[] {
    return (conversationsByProjectId[projectId] ?? [])
      .map((conversationId) => conversationsById[conversationId])
      .filter((conversation): conversation is ConversationResponse => Boolean(conversation))
  }

  function currentMessages(conversationId: string | null): ConversationMessageResponse[] {
    if (!conversationId) return []
    return messagesByConversationId[conversationId] ?? []
  }

  function currentTurns(conversationId: string | null): ConversationTurnResponse[] {
    if (!conversationId) return []
    return turnsByConversationId[conversationId] ?? []
  }

  function setTurns(
    nextTurns: ConversationTurnResponse[],
    conversationId = currentConversationId.value,
  ): void {
    if (!conversationId) return
    turnsByConversationId[conversationId] = [...nextTurns].sort((left, right) => {
      const leftSeq = left.user_message?.sequence_no ?? left.assistant_events[0]?.sequence_no ?? 0
      const rightSeq =
        right.user_message?.sequence_no ?? right.assistant_events[0]?.sequence_no ?? 0
      return leftSeq - rightSeq
    })
  }

  function upsertTurn(
    turn: ConversationTurnResponse,
    conversationId = currentConversationId.value,
  ): void {
    if (!conversationId) return
    const currentTurnsList = turnsByConversationId[conversationId] ?? []
    const existingIndex = currentTurnsList.findIndex((item) => item.turn_id === turn.turn_id)
    if (existingIndex === -1) {
      setTurns([...currentTurnsList, turn], conversationId)
      return
    }
    const nextTurns = [...currentTurnsList]
    nextTurns[existingIndex] = turn
    setTurns(nextTurns, conversationId)
  }

  function setMessages(
    nextMessages: ConversationMessageResponse[],
    conversationId = currentConversationId.value,
  ): void {
    if (!conversationId) return
    messagesByConversationId[conversationId] = nextMessages
  }

  async function loadConversations(projectId: string): Promise<void> {
    loadingProjectLists[projectId] = true
    try {
      const response = await api.listConversations(projectId)
      const nextIds = response.items.map((conversation) => {
        conversationsById[conversation.conversation_id] = conversation
        return conversation.conversation_id
      })

      const previousIds = conversationsByProjectId[projectId] ?? []
      for (const conversationId of previousIds) {
        if (!nextIds.includes(conversationId)) {
          removeConversationEntity(conversationId)
        }
      }

      setProjectConversationIds(projectId, nextIds)
    } finally {
      loadingProjectLists[projectId] = false
    }
  }

  async function createConversation(
    projectId: string,
    title?: string,
  ): Promise<ConversationResponse> {
    const conversation = await api.createConversation({ project_id: projectId, title })
    syncConversation(conversation)
    currentConversationId.value = conversation.conversation_id
    setMessages([], conversation.conversation_id)
    setTurns([], conversation.conversation_id)

    const project = projectStore.projectsById[projectId]
    if (project) {
      projectStore.patchProject(projectId, {
        conversation_count: (project.conversation_count ?? 0) + 1,
      })
    }

    return conversation
  }

  async function selectConversation(conversationId: string): Promise<void> {
    currentConversationId.value = conversationId
    const hasMessages = currentMessages(conversationId).length > 0
    const hasTurns = currentTurns(conversationId).length > 0
    if (!hasMessages && !hasTurns) {
      await loadMessages(conversationId)
    }
  }

  async function loadMessages(conversationId: string): Promise<void> {
    loadingConversationContent[conversationId] = true
    try {
      const [messageResponse, turnResponse] = await Promise.all([
        api.listMessages(conversationId),
        api.listTurns(conversationId),
      ])
      setMessages(messageResponse, conversationId)
      setTurns(turnResponse, conversationId)
    } finally {
      loadingConversationContent[conversationId] = false
    }
  }

  async function updateTitle(conversationId: string, title: string): Promise<void> {
    const conversation = await api.updateConversation(conversationId, { title })
    syncConversation(conversation)
  }

  async function deleteConversation(conversationId: string): Promise<void> {
    const conversation = conversationsById[conversationId]
    await api.deleteConversation(conversationId)
    removeConversationEntity(conversationId)

    if (conversation) {
      const project = projectStore.projectsById[conversation.project_id]
      if (project) {
        projectStore.patchProject(conversation.project_id, {
          conversation_count: Math.max(0, (project.conversation_count ?? 0) - 1),
        })
      }
    }
  }

  async function forkConversation(
    conversationId: string,
    title?: string,
    forkedAtMessageId?: string,
  ): Promise<ConversationResponse> {
    const conversation = await api.forkConversation(conversationId, {
      title,
      forked_at_message_id: forkedAtMessageId ?? null,
    })
    syncConversation(conversation)
    currentConversationId.value = conversation.conversation_id
    setMessages([], conversation.conversation_id)
    setTurns([], conversation.conversation_id)
    await loadMessages(conversation.conversation_id)

    const project = projectStore.projectsById[conversation.project_id]
    if (project) {
      projectStore.patchProject(conversation.project_id, {
        conversation_count: (project.conversation_count ?? 0) + 1,
      })
    }

    return conversation
  }

  async function updateMessage(
    conversationId: string,
    messageId: string,
    content: string,
    options?: {
      images?: string[] | null
      paperIds?: string[] | null
    },
  ): Promise<void> {
    const message = await api.updateMessage(conversationId, messageId, {
      content,
      images: options?.images ?? undefined,
      paper_ids: options?.paperIds ?? undefined,
    })
    const currentMessagesList = currentMessages(conversationId)
    const messageIndex = currentMessagesList.findIndex((item) => item.message_id === messageId)
    if (messageIndex !== -1) {
      const nextMessages = [...currentMessagesList]
      nextMessages[messageIndex] = message
      setMessages(nextMessages, conversationId)
    }
    touchConversation(conversationId)
    if (message.role !== 'user') {
      await loadMessages(conversationId)
      return
    }
    const turnId = message.turn_id
    if (turnId) {
      const currentTurnsList = currentTurns(conversationId)
      const turnIndex = currentTurnsList.findIndex((turn) => turn.turn_id === turnId)
      if (turnIndex !== -1 && currentTurnsList[turnIndex].user_message) {
        const nextTurns = [...currentTurnsList]
        nextTurns[turnIndex] = {
          ...nextTurns[turnIndex],
          user_message: message,
          assistant_events: [],
          trace_ids: [],
        }
        setTurns(
          nextTurns.filter(
            (turn) =>
              (turn.user_message?.sequence_no ?? Number.MAX_SAFE_INTEGER) <= message.sequence_no,
          ),
          conversationId,
        )
      }
    }
  }

  async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await api.deleteMessage(conversationId, messageId)
    setMessages(
      currentMessages(conversationId).filter((message) => {
        if (message.message_id === messageId) return false
        const matchedTurn = currentTurns(conversationId).find((turn) => turn.user_message?.message_id === messageId)
        if (!matchedTurn) return true
        return message.turn_id !== matchedTurn.turn_id || message.role !== 'user'
      }),
      conversationId,
    )
    setTurns(
      currentTurns(conversationId)
        .map((turn) => {
          if (turn.user_message?.message_id === messageId) {
            return {
              ...turn,
              user_message: null,
            }
          }

          if (turn.assistant_events.some((event) => event.message_id === messageId)) {
            return {
              ...turn,
              assistant_events: turn.assistant_events.filter((event) => event.message_id !== messageId),
            }
          }

          return turn
        })
        .filter((turn) => turn.user_message !== null || turn.assistant_events.length > 0),
      conversationId,
    )
    touchConversation(conversationId)
  }

  async function deleteTurn(conversationId: string, turnId: string): Promise<void> {
    await api.deleteTurn(conversationId, turnId)
    setMessages(
      currentMessages(conversationId).filter((message) => message.turn_id !== turnId),
      conversationId,
    )
    setTurns(
      currentTurns(conversationId).filter((turn) => turn.turn_id !== turnId),
      conversationId,
    )
    touchConversation(conversationId)
  }

  async function renameConversation(conversationId: string, title: string): Promise<void> {
    const conversation = await api.updateConversation(conversationId, { title })
    syncConversation(conversation)
  }

  function removeMessagesAfter(
    messageId: string,
    conversationId = currentConversationId.value,
  ): void {
    if (!conversationId) return
    const currentMessagesList = currentMessages(conversationId)
    const messageIndex = currentMessagesList.findIndex(
      (message) => message.message_id === messageId,
    )
    if (messageIndex !== -1) {
      const nextMessages = currentMessagesList.slice(0, messageIndex + 1)
      setMessages(nextMessages, conversationId)
      const cutoff = nextMessages[messageIndex]?.sequence_no ?? Number.MAX_SAFE_INTEGER
      setTurns(
        currentTurns(conversationId).filter(
          (turn) => (turn.user_message?.sequence_no ?? Number.MAX_SAFE_INTEGER) <= cutoff,
        ),
        conversationId,
      )
    }
  }

  function prepareTurnReplay(
    userMessageId: string,
    conversationId = currentConversationId.value,
  ): void {
    if (!conversationId) return
    const currentTurnsList = currentTurns(conversationId)
    const turn = currentTurnsList.find((item) => item.user_message?.message_id === userMessageId)
    if (!turn?.user_message) return

    const cutoff = turn.user_message.sequence_no
    setMessages(
      currentMessages(conversationId).filter(
        (message) => message.role === 'system' || message.sequence_no <= cutoff,
      ),
      conversationId,
    )

    setTurns(
      currentTurnsList
        .filter((item) => (item.user_message?.sequence_no ?? Number.MAX_SAFE_INTEGER) <= cutoff)
        .map((item) =>
          item.turn_id === turn.turn_id
            ? {
                ...item,
                assistant_events: [],
                trace_ids: [],
              }
            : item,
        ),
      conversationId,
    )
  }

  return {
    conversationsByProjectId,
    conversationsById,
    messagesByConversationId,
    turnsByConversationId,
    currentConversationId,
    currentConversation,
    messages,
    turns,
    loading,
    loadingProjectLists,
    loadingConversationContent,
    clearCurrentConversation,
    projectConversations,
    currentMessages,
    currentTurns,
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
    setMessages,
    setTurns,
    upsertTurn,
    removeMessagesAfter,
    prepareTurnReplay,
    syncConversation,
    touchConversation,
  }
})
