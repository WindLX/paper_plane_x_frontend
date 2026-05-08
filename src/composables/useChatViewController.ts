import { computed, reactive, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useConversationStore } from '@/stores/conversation'
import { useConversationWsStore } from '@/stores/conversationWs'
import { useHitlWsStore } from '@/stores/hitlWs'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'
import { useHitlWs } from '@/composables/useHitlWs'
import type { ConversationMessageResponse, ConversationTurnResponse, HITLAnswer } from '@/types/api'

export function useChatViewController(projectId: Ref<string>) {
  const { t } = useI18n()
  const router = useRouter()
  const chatStore = useConversationStore()
  const conversationWsStore = useConversationWsStore()
  const hitlWsStore = useHitlWsStore()
  const { currentQuestion, answerQuestion } = useHitlWs(() => chatStore.currentConversationId)
  const notify = useNotify()
  const dialog = useDialog()

  // ── Input state ────────────────────────────────────────────────────────
  const inputValue = ref('')
  const inputImages = ref<string[]>([])
  const inputPaperIds = ref<string[]>([])
  const inputExpanded = ref(false)

  // ── Editing state ──────────────────────────────────────────────────────
  const hoveredMessageId = ref<string | null>(null)
  const editingMessageId = ref<string | null>(null)
  const editingContent = ref('')
  const editingImages = ref<string[]>([])
  const editingPaperIds = ref<string[]>([])
  const editingTitle = ref(false)
  const editingTitleValue = ref('')
  const forkingTurnId = ref<string | null>(null)

  // ── Computed: conversation data ────────────────────────────────────────
  const conversation = computed(() => chatStore.currentConversation)
  const messages = computed(() => chatStore.messages)
  const turns = computed(() => chatStore.turns)
  const currentConversationId = computed(() => chatStore.currentConversationId)

  // ── State machine ──────────────────────────────────────────────────────
  type ConversationStatus = 'idle' | 'loading' | 'ready' | 'streaming' | 'waiting_hitl' | 'error'

  const status = computed<ConversationStatus>(() => {
    if (!currentConversationId.value) return 'idle'
    const contentLoading = chatStore.loadingConversationContent[currentConversationId.value]
    if (contentLoading) return 'loading'
    const ss = currentSocketState.value
    if (ss?.error) return 'error'
    if (ss?.isStreaming) return 'streaming'
    if (currentQuestion.value) return 'waiting_hitl'
    return 'ready'
  })

  // ── Computed: streaming state ──────────────────────────────────────────
  const currentSocketState = computed(() => {
    const conversationId = currentConversationId.value
    return conversationId ? conversationWsStore.getState(conversationId) : null
  })
  const isStreaming = computed(() => currentSocketState.value?.isStreaming ?? false)
  const isToolCalling = computed(() => currentSocketState.value?.isToolCalling ?? false)
  const streamPhase = computed(() => currentSocketState.value?.streamPhase ?? 'idle')
  const pendingStop = computed(() => currentSocketState.value?.pendingStop ?? false)
  const streamingTurn = computed(() => currentSocketState.value?.streamingTurn ?? null)
  const streamingTurnId = computed(() => streamingTurn.value?.turn_id ?? null)
  const renderedTurns = computed(() => {
    if (!isStreaming.value || !streamingTurn.value?.turn_id) {
      return turns.value
    }

    const targetIndex = turns.value.findIndex(
      (turn) => turn.turn_id === streamingTurn.value?.turn_id,
    )
    if (targetIndex === -1) {
      return turns.value
    }

    const nextTurns = [...turns.value]
    const existingTurn = nextTurns[targetIndex]
    nextTurns[targetIndex] = {
      ...existingTurn,
      user_message: streamingTurn.value.user_message ?? existingTurn.user_message,
      assistant_events:
        streamingTurn.value.assistant_events.length > 0
          ? streamingTurn.value.assistant_events
          : existingTurn.assistant_events,
      trace_ids:
        streamingTurn.value.trace_ids.length > 0
          ? streamingTurn.value.trace_ids
          : existingTurn.trace_ids,
    }
    return nextTurns
  })
  const showStreamingTurn = computed(() =>
    Boolean(
      isStreaming.value &&
      streamingTurn.value &&
      !turns.value.some((turn) => turn.turn_id === streamingTurn.value?.turn_id),
    ),
  )

  // ── Socket helper ──────────────────────────────────────────────────────
  async function ensureSocketReady(convId: string): Promise<void> {
    const socketState = conversationWsStore.getState(convId)
    if (socketState.status === 'idle' || socketState.status === 'disconnected') {
      conversationWsStore.connect(convId)
    }

    if (socketState.status !== 'connected') {
      await new Promise<void>((resolve) => {
        const unwatch = watch(
          () => conversationWsStore.getState(convId).status,
          (status) => {
            if (status === 'connected' || status === 'error') {
              unwatch()
              resolve()
            }
          },
        )
        setTimeout(() => {
          unwatch()
          resolve()
        }, 5000)
      })
    }
  }

  // ── Send / Stop ────────────────────────────────────────────────────────
  async function sendMessage(): Promise<void> {
    const text = inputValue.value.trim()
    if (!text || isStreaming.value) return

    let convId = chatStore.currentConversationId

    if (!conversation.value) {
      const title = text.slice(0, 12)
      const conv = await chatStore.createConversation(projectId.value, title)
      convId = conv.conversation_id
    }
    if (!convId) return

    const imagesToSend = inputImages.value.length > 0 ? [...inputImages.value] : undefined
    const paperIdsToSend = inputPaperIds.value.length > 0 ? [...inputPaperIds.value] : undefined
    inputValue.value = ''
    inputImages.value = []
    inputPaperIds.value = []

    await ensureSocketReady(convId)
    conversationWsStore.sendMessage(convId, text, undefined, imagesToSend, paperIdsToSend)
  }

  function stopStream(): void {
    const convId = currentConversationId.value
    if (!convId || pendingStop.value) return
    conversationWsStore.stopGeneration(convId)
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function isNewDay(
    prev: ConversationTurnResponse | undefined,
    curr: ConversationTurnResponse,
  ): boolean {
    const currAnchor = curr.user_message?.created_at ?? curr.assistant_events[0]?.created_at
    if (!currAnchor) return false
    if (!prev) return true
    const prevAnchor = prev.user_message?.created_at ?? prev.assistant_events[0]?.created_at
    if (!prevAnchor) return true
    const prevDate = new Date(prevAnchor).toDateString()
    const currDate = new Date(currAnchor).toDateString()
    return prevDate !== currDate
  }

  function turnForkAnchorMessageId(turn: ConversationTurnResponse): string | null {
    const assistantLast = turn.assistant_events[turn.assistant_events.length - 1]
    return assistantLast?.message_id ?? turn.user_message?.message_id ?? null
  }

  // ── Edit ───────────────────────────────────────────────────────────────
  function startEdit(msg: ConversationMessageResponse): void {
    if (msg.role !== 'user') return
    editingMessageId.value = msg.message_id
    editingContent.value = msg.content ?? ''
    editingImages.value = msg.images ?? []
    editingPaperIds.value = msg.paper_ids ?? []
  }

  function cancelEdit(): void {
    editingMessageId.value = null
    editingContent.value = ''
    editingImages.value = []
    editingPaperIds.value = []
  }

  async function confirmEdit(msg: ConversationMessageResponse): Promise<void> {
    const convId = conversation.value?.conversation_id
    if (!convId) return
    const content = editingContent.value.trim()
    if (!content || content === msg.content) {
      cancelEdit()
      return
    }
    try {
      await ensureSocketReady(convId)
      const sent = conversationWsStore.sendMessage(
        convId,
        content,
        msg.message_id,
        editingImages.value.length > 0 ? [...editingImages.value] : undefined,
        editingPaperIds.value.length > 0 ? [...editingPaperIds.value] : undefined,
      )
      if (!sent) {
        throw new Error(t('projects.errors.requestFailed'))
      }
      chatStore.prepareTurnReplay(msg.message_id)
      notify.push(t('projects.chatView.messageEdited'), 'success', 2000)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
    cancelEdit()
  }

  // ── Turn actions ───────────────────────────────────────────────────────
  async function deleteUserMessage(msg: ConversationMessageResponse): Promise<void> {
    const convId = conversation.value?.conversation_id
    if (!convId) return
    const confirmed = await dialog.confirm({
      title: t('projects.chatView.deleteMessage'),
      message: t('projects.chatView.confirmDeleteMessage'),
      confirmText: t('projects.actions.delete'),
      cancelText: t('projects.actions.cancel'),
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await chatStore.deleteMessage(convId, msg.message_id)
      notify.push(t('projects.chatView.messageDeleted'), 'success', 2000)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function deleteAssistantMessages(turn: ConversationTurnResponse): Promise<void> {
    const convId = conversation.value?.conversation_id
    if (!convId) return
    const confirmed = await dialog.confirm({
      title: t('projects.chatView.deleteAssistantTurn'),
      message: t('projects.chatView.confirmDeleteAssistantTurn'),
      confirmText: t('projects.actions.delete'),
      cancelText: t('projects.actions.cancel'),
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      for (const event of [...turn.assistant_events]) {
        await chatStore.deleteMessage(convId, event.message_id)
      }
      notify.push(t('projects.chatView.turnDeleted'), 'success', 2000)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function forkTurn(turn: ConversationTurnResponse, anchorMessageId?: string): Promise<void> {
    const convId = conversation.value?.conversation_id
    if (!convId) return
    const actualAnchorId = anchorMessageId ?? turnForkAnchorMessageId(turn)
    if (!actualAnchorId) return
    const confirmed = await dialog.confirm({
      title: t('projects.chatView.forkTurn'),
      message: t('projects.chatView.confirmForkTurn'),
      confirmText: t('projects.actions.confirm'),
      cancelText: t('projects.actions.cancel'),
    })
    if (!confirmed) return
    forkingTurnId.value = turn.turn_id
    try {
      const title = `${conversation.value?.title ?? ''} (分支)`
      await chatStore.forkConversation(convId, title, actualAnchorId)
      notify.push(t('projects.chatView.conversationForked'), 'success', 2000)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    } finally {
      forkingTurnId.value = null
    }
  }

  async function rerunTurn(turn: ConversationTurnResponse): Promise<void> {
    const userMessage = turn.user_message
    const convId = conversation.value?.conversation_id
    if (!userMessage || !convId) return
    await ensureSocketReady(convId)
    const sent = conversationWsStore.sendMessage(
      convId,
      userMessage.content ?? '',
      userMessage.message_id,
      userMessage.images ?? undefined,
      userMessage.paper_ids ?? undefined,
    )
    if (!sent) {
      notify.push(t('projects.errors.requestFailed'), 'error', 3600)
      return
    }
    chatStore.prepareTurnReplay(userMessage.message_id)
  }

  // ── HITL ───────────────────────────────────────────────────────────────
  function submitHitlAnswer(answers: HITLAnswer[]): void {
    const questionId = currentQuestion.value?.question_id
    if (!questionId) return
    answerQuestion(questionId, answers)
    const convId = currentConversationId.value
    if (convId) {
      void ensureSocketReady(convId)
    }
  }

  // ── Conversation actions ───────────────────────────────────────────────
  async function updateTitle(title: string | null): Promise<void> {
    const convId = conversation.value?.conversation_id
    if (!convId || !title) return
    try {
      await chatStore.updateTitle(convId, title)
      notify.push(t('projects.chatView.conversationRenamed'), 'success', 2000)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function deleteConversation(): Promise<void> {
    const convId = conversation.value?.conversation_id
    if (!convId) return
    const confirmed = await dialog.confirm({
      title: t('projects.chatView.deleteMessage'),
      message: t('projects.chatView.confirmDeleteConversation'),
      confirmText: t('projects.actions.delete'),
      cancelText: t('projects.actions.cancel'),
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await chatStore.deleteConversation(convId)
      notify.push(t('projects.chatView.messageDeleted'), 'success', 2000)
      await router.push(`/projects/${projectId.value}`)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  // ── Watchers: conversation switching ───────────────────────────────────
  watch(
    () => chatStore.currentConversationId,
    (newId, oldId) => {
      if (!newId) return
      conversationWsStore.switchActiveConversation(newId, oldId)
      if (newId !== oldId) {
        inputValue.value = ''
        inputImages.value = []
        inputPaperIds.value = []
        inputExpanded.value = false
      }
    },
    { immediate: true },
  )

  watch(
    () => [currentConversationId.value, turns.value.map((turn) => turn.turn_id).join(',')] as const,
    ([conversationId]) => {
      if (!conversationId) return
      const socketState = conversationWsStore.getState(conversationId)
      const persistedTurnIds = new Set(
        chatStore.currentTurns(conversationId).map((turn) => turn.turn_id),
      )
      if (
        !socketState.isStreaming &&
        socketState.streamingTurn?.turn_id &&
        persistedTurnIds.has(socketState.streamingTurn.turn_id)
      ) {
        conversationWsStore.resetStreamingState(conversationId)
        return
      }
      if (
        socketState.completionStatus === 'stopped' &&
        !hitlWsStore.questionForConversation(conversationId)
      ) {
        conversationWsStore.resetStreamingState(conversationId)
      }
    },
  )

  return reactive({
    // Reactive state
    inputValue,
    inputImages,
    inputPaperIds,
    inputExpanded,
    hoveredMessageId,
    editingMessageId,
    editingContent,
    editingImages,
    editingPaperIds,
    editingTitle,
    editingTitleValue,
    forkingTurnId,
    // Computed
    conversation,
    messages,
    turns,
    renderedTurns,
    currentConversationId,
    currentSocketState,
    status,
    isStreaming,
    isToolCalling,
    streamPhase,
    pendingStop,
    streamingTurn,
    streamingTurnId,
    showStreamingTurn,
    currentQuestion,
    // Methods
    sendMessage,
    stopStream,
    isNewDay,
    turnForkAnchorMessageId,
    startEdit,
    cancelEdit,
    confirmEdit,
    deleteUserMessage,
    deleteAssistantMessages,
    forkTurn,
    rerunTurn,
    submitHitlAnswer,
    updateTitle,
    deleteConversation,
  })
}
