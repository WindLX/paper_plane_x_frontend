<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileText, MessageSquare } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import CopyableText from '@/components/CopyableText.vue'
import JsonPanel from '@/components/JsonPanel.vue'
import type { ConversationResponse, ConversationTurnResponse } from '@/types/api'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  conversation: ConversationResponse
  turns: ConversationTurnResponse[]
  traceIds: string[]
}>()

const emit = defineEmits<{
  openPaper: [paperId: string]
  scrollToTurn: [turnId: string]
}>()

const { t } = useI18n()
const outlineOpen = ref(true)
const refsOpen = ref(true)

const paperReferences = computed(() => {
  const refs = new Map<string, string>()
  const paperPattern = /\[\[\s*(pap-[^\]\\\s|]+)(?:\s*\\?\|\s*([^\]\n]+?))?\s*\\?\]\\?\]/gi
  for (const turn of props.turns) {
    for (const event of turn.assistant_events) {
      const source =
        event.message_kind === 'assistant_reasoning'
          ? (event.reasoning_content ?? event.content ?? '')
          : (event.content ?? '')
      if (!source) continue
      for (const match of source.matchAll(paperPattern)) {
        const paperId = match[1].replace(/[\\.,;:，。；：]+$/g, '')
        const label = match[2]?.replace(/\\+$/g, '').trim() || paperId
        refs.set(paperId, label)
      }
    }
  }
  return Array.from(refs.entries()).map(([paperId, label]) => ({ paperId, label }))
})

const hasPaperReferences = computed(() => paperReferences.value.length > 0)

interface OutlineItem {
  turnId: string
  label: string
}

const turnOutline = computed(() => {
  const items: OutlineItem[] = []
  for (let i = 0; i < props.turns.length; i++) {
    const turn = props.turns[i]
    let label = ''
    if (turn.user_message?.content) {
      label = turn.user_message.content.slice(0, 40)
    } else {
      const final = turn.assistant_events.find((event) => event.message_kind === 'assistant_final')
      if (final?.content) {
        label = final.content.slice(0, 40)
      }
    }
    if (!label) label = `Turn ${i + 1}`
    if (label.length >= 40) label += '…'
    items.push({ turnId: turn.turn_id, label })
  }
  return items
})

const hasOutline = computed(() => turnOutline.value.length > 0)
</script>

<template>
  <div class="max-h-full min-h-0 space-y-3 overflow-y-auto">
    <header class="workspace-panel space-y-3 p-3.5">
      <h3 class="workspace-section-title">{{ conversation.title }}</h3>
      <div class="flex items-center justify-between gap-3">
        <CopyableText :text="conversation.conversation_id" mono />
      </div>
      <div class="text-ppx-text-soft grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('projects.chatDrawer.tabConversation')
          }}</span>
          <div>{{ turns.length }}</div>
        </div>
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">Trace IDs</span>
          <div>{{ traceIds.length }}</div>
        </div>
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('projects.common.createdAt')
          }}</span>
          <div>{{ formatDateTime(conversation.created_at) }}</div>
        </div>
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('projects.common.updatedAt')
          }}</span>
          <div>{{ formatDateTime(conversation.updated_at) }}</div>
        </div>
      </div>
    </header>

    <JsonPanel
      :title="t('projects.chatDrawer.conversationTitle')"
      :value="{
        conversation,
        turn_count: turns.length,
        trace_ids: traceIds,
      }"
      :default-open="false"
      max-height="22vh"
    />

    <div v-if="hasOutline" class="workspace-panel overflow-hidden">
      <button
        type="button"
        class="workspace-section-title flex w-full cursor-pointer items-center gap-2 p-3.5 text-sm"
        @click="outlineOpen = !outlineOpen"
      >
        <MessageSquare class="h-4 w-4" />
        <span>{{ t('projects.chatDrawer.turnOutline') }}</span>
        <span class="workspace-chip ml-auto text-xs">{{ turnOutline.length }}</span>
      </button>
      <Transition name="section-collapse">
        <div v-if="outlineOpen" class="max-h-48 space-y-1 overflow-y-auto px-3.5 pb-3.5">
          <button
            v-for="(item, idx) in turnOutline"
            :key="item.turnId"
            type="button"
            class="hover:bg-ppx-bg-subtle flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors"
            @click="emit('scrollToTurn', item.turnId)"
          >
            <span class="text-ppx-text-muted shrink-0 font-mono">{{ idx + 1 }}</span>
            <span class="text-ppx-text-soft truncate">{{ item.label }}</span>
          </button>
        </div>
      </Transition>
    </div>

    <div v-if="hasPaperReferences" class="workspace-panel overflow-hidden">
      <button
        type="button"
        class="workspace-section-title flex w-full cursor-pointer items-center gap-2 p-3.5 text-sm"
        @click="refsOpen = !refsOpen"
      >
        <FileText class="h-4 w-4" />
        <span>{{ t('projects.chatView.references') }}</span>
        <span class="workspace-chip ml-auto text-xs">{{ paperReferences.length }}</span>
      </button>
      <Transition name="section-collapse">
        <div v-if="refsOpen" class="flex flex-wrap gap-2 px-3.5 pb-3.5">
          <button
            v-for="paperRef in paperReferences"
            :key="paperRef.paperId"
            type="button"
            class="workspace-chip hover-lift cursor-pointer text-left"
            @click="emit('openPaper', paperRef.paperId)"
          >
            {{ paperRef.paperId }} | {{ paperRef.label }}
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>
