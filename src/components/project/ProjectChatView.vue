<script setup lang="ts">
import { nextTick, ref, watch, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import HitlQuestionPanel from './chat-view/HitlQuestionPanel.vue'
import ChatViewHeader from './chat-view/ChatViewHeader.vue'
import ChatEmptyState from './chat-view/ChatEmptyState.vue'
import ChatDateSeparator from './chat-view/ChatDateSeparator.vue'
import ChatUserMessage from './chat-view/ChatUserMessage.vue'
import ChatAssistantTurn from './chat-view/ChatAssistantTurn.vue'
import ChatSystemMessage from './chat-view/ChatSystemMessage.vue'
import ChatInputBox from './chat-view/ChatInputBox.vue'
import { useChatViewController } from '@/composables/useChatViewController'

const props = defineProps<{
  projectId: string
  scrollToTurnId?: string | null
}>()

const emit = defineEmits<{
  toggleSidebar: []
  openPaper: [paperId: string]
  openDetails: []
}>()

const { t } = useI18n()

const ctrl = useChatViewController(toRef(props, 'projectId'))

// ── Scroll state (kept in component — pure UI concern) ──────────────────
const chatContainerRef = ref<HTMLDivElement | null>(null)
const isUserScrolling = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
let autoScrollFlag: ReturnType<typeof setTimeout> | null = null
let isAutoScrolling = false

// Scroll to turn from drawer outline click
watch(
  () => props.scrollToTurnId,
  (turnId) => {
    if (!turnId) return
    nextTick(() => {
      const el = document.getElementById(`turn-${turnId}`)
      if (el && chatContainerRef.value) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
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
  () => ctrl.messages.length,
  () => scrollToBottom(),
  { flush: 'post' },
)

watch(
  () => ctrl.streamingTurn?.assistant_events.length,
  () => scrollToBottom(),
  { flush: 'post' },
)
</script>

<template>
  <div class="text-ppx-text-soft flex h-full flex-1 flex-col">
    <ChatViewHeader
      v-model:editing="ctrl.editingTitle"
      v-model:editing-value="ctrl.editingTitleValue"
      :title="ctrl.conversation?.title ?? null"
      :is-streaming="ctrl.isStreaming"
      :has-conversation="Boolean(ctrl.conversation)"
      @toggle-sidebar="emit('toggleSidebar')"
      @open-details="emit('openDetails')"
      @update:title="ctrl.updateTitle"
      @delete="ctrl.deleteConversation"
    />

    <!-- Messages area -->
    <div
      ref="chatContainerRef"
      class="dark:bg-ppx-bg min-h-0 flex-1 space-y-0 overflow-y-auto bg-neutral-50"
      @scroll="onScroll"
    >
      <!-- Empty state -->
      <ChatEmptyState
        v-if="!ctrl.currentQuestion && !ctrl.isStreaming && !ctrl.renderedTurns.length"
        v-model="ctrl.inputValue"
        v-model:paper-ids="ctrl.inputPaperIds"
        :project-id="props.projectId"
        :disabled="ctrl.isStreaming"
        @send="ctrl.sendMessage"
      />

      <!-- System messages -->
      <template
        v-for="msg in ctrl.messages.filter((item: any) => item.role === 'system')"
        :key="msg.message_id"
      >
        <ChatSystemMessage :msg="msg" />
      </template>

      <!-- Turn list -->
      <template v-for="(turn, idx) in ctrl.renderedTurns" :key="turn.turn_id">
        <ChatDateSeparator
          v-if="ctrl.isNewDay(ctrl.renderedTurns[idx - 1], turn)"
          :date="turn.user_message?.created_at ?? turn.assistant_events[0]?.created_at ?? ''"
        />

        <section :id="`turn-${turn.turn_id}`">
          <ChatUserMessage
            v-if="turn.user_message"
            v-model:edit-content="ctrl.editingContent"
            v-model:edit-images="ctrl.editingImages"
            v-model:edit-paper-ids="ctrl.editingPaperIds"
            :msg="turn.user_message"
            :hovered="ctrl.hoveredMessageId === turn.user_message.message_id"
            :editing="ctrl.editingMessageId === turn.user_message.message_id"
            :fork-loading="ctrl.forkingTurnId === turn.turn_id"
            :project-id="props.projectId"
            @mouseenter="ctrl.hoveredMessageId = turn.user_message.message_id"
            @mouseleave="ctrl.hoveredMessageId = null"
            @edit="ctrl.startEdit(turn.user_message)"
            @rerun="ctrl.rerunTurn(turn)"
            @delete="ctrl.deleteUserMessage(turn.user_message)"
            @fork="ctrl.forkTurn(turn, turn.user_message?.message_id)"
            @confirm-edit="ctrl.confirmEdit(turn.user_message)"
            @cancel-edit="ctrl.cancelEdit"
            @open-paper="emit('openPaper', $event)"
          />

          <ChatAssistantTurn
            v-if="turn.assistant_events.length > 0"
            :turn="turn"
            :is-streaming="ctrl.isStreaming && ctrl.streamingTurnId === turn.turn_id"
            :is-tool-calling="
              ctrl.isStreaming && ctrl.streamingTurnId === turn.turn_id && ctrl.isToolCalling
            "
            :stream-phase="
              ctrl.isStreaming && ctrl.streamingTurnId === turn.turn_id ? ctrl.streamPhase : 'idle'
            "
            :pending-stop="
              ctrl.isStreaming && ctrl.streamingTurnId === turn.turn_id ? ctrl.pendingStop : false
            "
            :fork-loading="ctrl.forkingTurnId === turn.turn_id"
            @stop-stream="ctrl.stopStream"
            @rerun="ctrl.rerunTurn(turn)"
            @delete="ctrl.deleteAssistantMessages(turn)"
            @fork="ctrl.forkTurn(turn)"
            @open-paper="emit('openPaper', $event)"
          />
        </section>
      </template>

      <template v-if="ctrl.showStreamingTurn && ctrl.streamingTurn">
        <ChatDateSeparator
          v-if="
            !ctrl.renderedTurns.length ||
            ctrl.isNewDay(ctrl.renderedTurns[ctrl.renderedTurns.length - 1], ctrl.streamingTurn)
          "
          :date="
            ctrl.streamingTurn.user_message?.created_at ??
            ctrl.streamingTurn.assistant_events[0]?.created_at ??
            ''
          "
        />
        <ChatUserMessage
          v-if="ctrl.streamingTurn.user_message"
          :msg="ctrl.streamingTurn.user_message"
          :hovered="false"
          :editing="false"
          :edit-content="''"
          :edit-images="[]"
        />
        <ChatAssistantTurn
          :turn="ctrl.streamingTurn"
          :is-streaming="true"
          :is-tool-calling="ctrl.isToolCalling"
          :stream-phase="ctrl.streamPhase"
          :pending-stop="ctrl.pendingStop"
          @stop-stream="ctrl.stopStream"
          @open-paper="emit('openPaper', $event)"
        />
      </template>

      <!-- Waiting-for-agent indicator -->
      <div
        v-if="ctrl.status === 'waiting_hitl' && !ctrl.currentQuestion"
        class="animate-fade-in-up border-ppx-border-strong mx-auto mt-6 max-w-3xl rounded-lg border border-dashed px-4 py-3 text-center"
      >
        <span class="text-ppx-text-muted text-sm">
          {{ t('projects.hitl.waiting') }}
        </span>
      </div>
    </div>

    <!-- HITL Question Panel -->
    <div
      v-if="ctrl.currentQuestion"
      class="dark:bg-ppx-bg-elevated border-ppx-border shrink-0 border-t bg-white px-4 py-4"
    >
      <div class="mx-auto max-w-3xl">
        <HitlQuestionPanel :question="ctrl.currentQuestion" @submit="ctrl.submitHitlAnswer" />
      </div>
    </div>

    <!-- Input area -->
    <div
      v-if="ctrl.renderedTurns.length > 0 || ctrl.isStreaming || ctrl.currentQuestion"
      class="dark:bg-ppx-bg-elevated border-ppx-border shrink-0 border-t bg-white px-4 py-4"
    >
      <div class="mx-auto max-w-3xl">
        <ChatInputBox
          v-model="ctrl.inputValue"
          v-model:images="ctrl.inputImages"
          v-model:paper-ids="ctrl.inputPaperIds"
          v-model:expanded="ctrl.inputExpanded"
          :project-id="props.projectId"
          :disabled="ctrl.isStreaming"
          @send="ctrl.sendMessage"
          @open-paper="emit('openPaper', $event)"
        />
        <div v-show="!ctrl.inputExpanded" class="text-ppx-text-muted mt-2 text-center text-xs">
          {{ t('projects.chatView.inputHint') }}
        </div>
      </div>
    </div>
  </div>
</template>
