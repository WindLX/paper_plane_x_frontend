<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import HitlQuestionPanel from './HitlQuestionPanel.vue'
import ChatViewHeader from './chat-view/ChatViewHeader.vue'
import ChatEmptyState from './chat-view/ChatEmptyState.vue'
import ChatDateSeparator from './chat-view/ChatDateSeparator.vue'
import ChatUserMessage from './chat-view/ChatUserMessage.vue'
import ChatAssistantTurn from './chat-view/ChatAssistantTurn.vue'
import ChatSystemMessage from './chat-view/ChatSystemMessage.vue'
import ChatInputBox from './chat-view/ChatInputBox.vue'
import { useConversationSocket } from '@/composables/useConversationSocket'
import { useHitl } from '@/composables/useHitl'
import { useConversationStore } from '@/stores/conversation'
import { useUiStore } from '@/stores/ui'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'
import { useRouter } from 'vue-router'
import type { ConversationMessageResponse, ConversationTurnResponse, HITLAnswer } from '@/types/api'
import { api } from '@/api'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const { t } = useI18n()
const router = useRouter()
const chatStore = useConversationStore()
const uiStore = useUiStore()
const notify = useNotify()
const dialog = useDialog()
const hitl = useHitl()

const inputValue = ref('')
const inputImages = ref<string[]>([])
const inputPaperIds = ref<string[]>([])
const inputExpanded = ref(false)
const chatContainerRef = ref<HTMLDivElement | null>(null)
const hoveredMessageId = ref<string | null>(null)
const editingMessageId = ref<string | null>(null)
const editingContent = ref('')
const editingImages = ref<string[]>([])
const editingTitle = ref(false)
const editingTitleValue = ref('')
const isUserScrolling = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
let autoScrollFlag: ReturnType<typeof setTimeout> | null = null
let isAutoScrolling = false

const socket = ref<ReturnType<typeof useConversationSocket> | null>(null)

const conversation = computed(() => chatStore.currentConversation)
const messages = computed(() => chatStore.messages)
const turns = computed(() => chatStore.turns)

const isStreaming = computed(() => socket.value?.isStreaming ?? false)
const streamingTurn = computed(() => socket.value?.streamingTurn ?? null)

// HITL
watch(
  () => conversation.value?.conversation_id,
  (convId) => {
    if (convId) {
      hitl.connect()
    } else {
      hitl.disconnect()
    }
  },
)

// Scroll to turn from drawer outline click
watch(
  () => uiStore.scrollToTurnId,
  (turnId) => {
    if (!turnId) return
    nextTick(() => {
      const el = document.getElementById(`turn-${turnId}`)
      if (el && chatContainerRef.value) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      uiStore.setScrollToTurnId(null)
    })
  },
)

function scrollToBottom(): void {
  if (isUserScrolling.value) return
  nextTick(() => {
    const el = chatContainerRef.value
    if (!el) return
    isAutoScrolling = true
    el.scrollTop = el.scrollHeight
    if (autoScrollFlag) clearTimeout(autoScrollFlag)
    autoScrollFlag = setTimeout(() => {
      isAutoScrolling = false
    }, 80)
  })
}

function onScroll(): void {
  if (isAutoScrolling) return
  isUserScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false
  }, 3000)
}

watch(
  () => messages.value.length,
  () => scrollToBottom(),
  { flush: 'post' },
)

watch(
  () => streamingTurn.value?.assistant_events.length,
  () => scrollToBottom(),
  { flush: 'post' },
)

watch(
  () => chatStore.currentConversationId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      // Try to reuse existing socket from store to avoid interrupting streaming on page switch
      const existing = chatStore.getSocket(newId)
      if (existing) {
        socket.value = existing as ReturnType<typeof useConversationSocket>
      } else {
        socket.value?.disconnect()
        chatStore.unregisterSocket(oldId ?? '')
        const newSocket = useConversationSocket(newId)
        socket.value = newSocket
        chatStore.registerSocket(newId, newSocket)
        newSocket.connect()
      }
      // Clear input state when switching conversations
      inputValue.value = ''
      inputImages.value = []
      inputPaperIds.value = []
      inputExpanded.value = false
    } else if (!newId) {
      socket.value?.disconnect()
      if (oldId) chatStore.unregisterSocket(oldId)
      socket.value = null
    }
  },
)

// Refresh sidebar when streaming ends
watch(
  () => socket.value?.isStreaming,
  (curr, prev) => {
    if (prev && !curr) {
      void chatStore.loadConversations(props.projectId)
    }
  },
)

// Note: we intentionally do NOT disconnect the socket on unmount
// so that streaming continues when the user navigates away from this page.
// The socket is kept alive via the conversation store's activeSockets map.

async function handleSend(): Promise<void> {
  const text = inputValue.value.trim()
  if (!text || isStreaming.value) return

  let convId = chatStore.currentConversationId

  if (!conversation.value) {
    const title = text.slice(0, 12)
    const conv = await chatStore.createConversation(props.projectId, title)
    convId = conv.conversation_id
  }
  if (!convId) return

  const imagesToSend = inputImages.value.length > 0 ? [...inputImages.value] : undefined
  const paperIdsToSend = inputPaperIds.value.length > 0 ? [...inputPaperIds.value] : undefined
  inputValue.value = ''
  inputImages.value = []
  inputPaperIds.value = []

  await ensureSocketReady(convId)

  socket.value?.sendMessage(text, undefined, imagesToSend, paperIdsToSend)
}

async function ensureSocketReady(convId: string): Promise<void> {
  if (convId && (!socket.value || socket.value.status === 'idle')) {
    const existing = chatStore.getSocket(convId)
    if (existing) {
      socket.value = existing as ReturnType<typeof useConversationSocket>
    } else {
      socket.value?.disconnect()
      const newSocket = useConversationSocket(convId)
      socket.value = newSocket
      chatStore.registerSocket(convId, newSocket)
      newSocket.connect()
    }
  }

  const currentSocket = socket.value
  if (currentSocket && currentSocket.status !== 'connected') {
    await new Promise<void>((resolve) => {
      const unwatch = watch(
        () => currentSocket.status,
        (s) => {
          if (s === 'connected' || s === 'error') {
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

function stopStream(): void {
  socket.value?.stopGeneration()
}

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

function startEdit(msg: ConversationMessageResponse): void {
  editingMessageId.value = msg.message_id
  editingContent.value = msg.content ?? ''
  editingImages.value = msg.images ?? []
}

function turnEditableAssistantMessage(
  turn: ConversationTurnResponse,
): ConversationMessageResponse | null {
  const finalEvent = [...turn.assistant_events]
    .reverse()
    .find((event) => event.message_kind === 'assistant_final')
  if (!finalEvent) return null
  return {
    message_id: finalEvent.message_id,
    conversation_id: conversation.value?.conversation_id ?? '',
    role: 'assistant',
    content: finalEvent.content,
    name: finalEvent.name,
    tool_calls: finalEvent.tool_calls,
    tool_call_id: finalEvent.tool_call_id,
    sequence_no: finalEvent.sequence_no,
    turn_id: turn.turn_id,
    parent_message_id: finalEvent.parent_message_id,
    message_kind: finalEvent.message_kind,
    trace_ids: turn.trace_ids,
    reasoning_content: null,
    images: null,
    paper_ids: null,
    created_at: finalEvent.created_at,
  }
}

function turnForkAnchorMessageId(turn: ConversationTurnResponse): string | null {
  const assistantLast = turn.assistant_events[turn.assistant_events.length - 1]
  return assistantLast?.message_id ?? turn.user_message?.message_id ?? null
}

function cancelEdit(): void {
  editingMessageId.value = null
  editingContent.value = ''
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
    if (msg.role === 'user') {
      chatStore.prepareTurnReplay(msg.message_id)
      await ensureSocketReady(convId)
      socket.value?.sendMessage(content, msg.message_id)
    } else {
      await api.updateMessage(convId, msg.message_id, { content })
      await chatStore.loadMessages(convId)
      await chatStore.loadConversations(props.projectId)
    }
    notify.push(t('chat.messageEdited'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
  cancelEdit()
}

async function handleDeleteTurn(turn: ConversationTurnResponse): Promise<void> {
  const convId = conversation.value?.conversation_id
  if (!convId) return
  const confirmed = await dialog.confirm({
    title: t('chat.deleteTurn'),
    message: t('chat.confirmDeleteTurn'),
    confirmText: t('actions.delete'),
    cancelText: t('actions.cancel'),
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    await chatStore.deleteTurn(convId, turn.turn_id)
    await chatStore.loadConversations(props.projectId)
    notify.push(t('chat.turnDeleted'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function handleForkTurn(
  turn: ConversationTurnResponse,
  anchorMessageId?: string,
): Promise<void> {
  const convId = conversation.value?.conversation_id
  if (!convId) return
  const actualAnchorId = anchorMessageId ?? turnForkAnchorMessageId(turn)
  if (!actualAnchorId) return
  const confirmed = await dialog.confirm({
    title: t('chat.forkTurn'),
    message: t('chat.confirmForkTurn'),
    confirmText: t('actions.confirm'),
    cancelText: t('actions.cancel'),
  })
  if (!confirmed) return
  try {
    const title = `${conversation.value?.title ?? ''} (分支)`
    await chatStore.forkConversation(convId, title, actualAnchorId)
    await chatStore.loadConversations(props.projectId)
    notify.push(t('chat.conversationForked'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function handleRerunTurn(turn: ConversationTurnResponse): Promise<void> {
  const userMessage = turn.user_message
  const convId = conversation.value?.conversation_id
  if (!userMessage || !convId) return
  chatStore.prepareTurnReplay(userMessage.message_id)
  await ensureSocketReady(convId)
  socket.value?.sendMessage(userMessage.content ?? '', userMessage.message_id)
}

function handleHitlSubmit(answers: HITLAnswer[]): void {
  hitl.submitAnswer(answers)
}

async function handleUpdateTitle(title: string | null): Promise<void> {
  const convId = conversation.value?.conversation_id
  if (!convId || !title) return
  try {
    await chatStore.updateTitle(convId, title)
    await chatStore.loadConversations(props.projectId)
    notify.push(t('chat.conversationRenamed'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function handleDeleteConversation(): Promise<void> {
  const convId = conversation.value?.conversation_id
  if (!convId) return
  const confirmed = await dialog.confirm({
    title: t('chat.deleteMessage'),
    message: t('chat.confirmDeleteConversation'),
    confirmText: t('actions.delete'),
    cancelText: t('actions.cancel'),
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    await chatStore.deleteConversation(convId)
    await chatStore.loadConversations(props.projectId)
    notify.push(t('chat.messageDeleted'), 'success', 2000)
    await router.push(`/projects/${props.projectId}`)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}
</script>

<template>
  <div class="text-ppx-text-soft flex h-full flex-col">
    <ChatViewHeader
      v-model:editing="editingTitle"
      v-model:editing-value="editingTitleValue"
      :title="conversation?.title ?? null"
      :is-streaming="isStreaming"
      @toggle-sidebar="emit('toggleSidebar')"
      @stop-stream="stopStream"
      @update:title="handleUpdateTitle"
      @delete="handleDeleteConversation"
    />

    <!-- Messages area -->
    <div
      ref="chatContainerRef"
      class="dark:bg-ppx-bg min-h-0 flex-1 space-y-0 overflow-y-auto bg-neutral-50"
      @scroll="onScroll"
    >
      <!-- Empty state -->
      <ChatEmptyState
        v-if="!turns.length && !isStreaming"
        v-model="inputValue"
        v-model:paper-ids="inputPaperIds"
        :project-id="props.projectId"
        :disabled="isStreaming"
        @send="handleSend"
      />

      <!-- System messages -->
      <template
        v-for="msg in messages.filter((item) => item.role === 'system')"
        :key="msg.message_id"
      >
        <ChatSystemMessage :msg="msg" />
      </template>

      <!-- Turn list -->
      <template v-for="(turn, idx) in turns" :key="turn.turn_id">
        <ChatDateSeparator
          v-if="isNewDay(turns[idx - 1], turn)"
          :date="turn.user_message?.created_at ?? turn.assistant_events[0]?.created_at ?? ''"
        />

        <section :id="`turn-${turn.turn_id}`">
          <ChatUserMessage
            v-if="turn.user_message"
            v-model:edit-content="editingContent"
            v-model:edit-images="editingImages"
            :msg="turn.user_message"
            :hovered="hoveredMessageId === turn.user_message.message_id"
            :editing="editingMessageId === turn.user_message.message_id"
            @mouseenter="hoveredMessageId = turn.user_message.message_id"
            @mouseleave="hoveredMessageId = null"
            @edit="startEdit(turn.user_message)"
            @rerun="handleRerunTurn(turn)"
            @delete="handleDeleteTurn(turn)"
            @fork="handleForkTurn(turn, turn.user_message?.message_id)"
            @confirm-edit="confirmEdit(turn.user_message)"
            @cancel-edit="cancelEdit"
          />

          <ChatAssistantTurn
            v-if="turn.assistant_events.length > 0"
            v-model:edit-content="editingContent"
            :turn="turn"
            :is-streaming="false"
            :is-tool-calling="false"
            :editing="
              !!turnEditableAssistantMessage(turn) &&
              editingMessageId === turnEditableAssistantMessage(turn)?.message_id
            "
            @edit="
              turnEditableAssistantMessage(turn) && startEdit(turnEditableAssistantMessage(turn)!)
            "
            @rerun="handleRerunTurn(turn)"
            @delete="handleDeleteTurn(turn)"
            @fork="handleForkTurn(turn)"
            @confirm-edit="
              turnEditableAssistantMessage(turn) && confirmEdit(turnEditableAssistantMessage(turn)!)
            "
            @cancel-edit="cancelEdit"
          />
        </section>
      </template>

      <template v-if="isStreaming && streamingTurn">
        <ChatDateSeparator
          v-if="!turns.length || isNewDay(turns[turns.length - 1], streamingTurn)"
          :date="
            streamingTurn.user_message?.created_at ??
            streamingTurn.assistant_events[0]?.created_at ??
            ''
          "
        />
        <ChatUserMessage
          v-if="streamingTurn.user_message"
          :msg="streamingTurn.user_message"
          :hovered="false"
          :editing="false"
          :edit-content="''"
          :edit-images="[]"
        />
        <ChatAssistantTurn
          :turn="streamingTurn"
          :is-streaming="true"
          :is-tool-calling="socket?.isToolCalling ?? false"
        />
      </template>
    </div>

    <!-- HITL Question Panel -->
    <div
      v-if="hitl.currentQuestion.value"
      class="dark:bg-ppx-bg-elevated border-ppx-border shrink-0 border-t bg-white px-4 py-4"
    >
      <div class="mx-auto max-w-3xl">
        <HitlQuestionPanel :question="hitl.currentQuestion.value" @submit="handleHitlSubmit" />
      </div>
    </div>

    <!-- Input area -->
    <div
      v-if="turns.length > 0 || isStreaming"
      class="dark:bg-ppx-bg-elevated border-ppx-border shrink-0 border-t bg-white px-4 py-4"
    >
      <div class="mx-auto max-w-3xl">
        <ChatInputBox
          v-model="inputValue"
          v-model:images="inputImages"
          v-model:paper-ids="inputPaperIds"
          v-model:expanded="inputExpanded"
          :project-id="props.projectId"
          :disabled="isStreaming"
          @send="handleSend"
        />
        <div v-show="!inputExpanded" class="text-ppx-text-muted mt-2 text-center text-xs">
          {{ t('chat.inputHint') }}
        </div>
      </div>
    </div>
  </div>
</template>
