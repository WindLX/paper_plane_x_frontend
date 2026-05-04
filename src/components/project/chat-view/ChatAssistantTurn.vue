<script setup lang="ts">
import { BrainCircuit, ChevronDown, ChevronRight, LoaderCircle, Wrench } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import JsonPanel from '@/components/JsonPanel.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import ChatTurnActions from './ChatTurnActions.vue'
import type { ConversationTurnEventResponse, ConversationTurnResponse } from '@/types/api'
import { Check, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  turn: ConversationTurnResponse
  isStreaming: boolean
  isToolCalling: boolean
  editing?: boolean
}>()

const editContent = defineModel<string>('editContent', { default: '' })

const emit = defineEmits<{
  edit: []
  rerun: []
  delete: []
  fork: []
  confirmEdit: []
  cancelEdit: []
  openPaper: [paperId: string]
}>()

const { t } = useI18n()
const hovered = ref(false)
const uiStore = useUiStore()

const events = computed(() =>
  [...props.turn.assistant_events].sort((a, b) => a.sequence_no - b.sequence_no),
)

function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toolName(event: ConversationTurnEventResponse): string {
  const firstToolCall = event.tool_calls?.[0]
  const fn = (firstToolCall?.function as Record<string, unknown> | undefined)?.name
  return (fn as string) ?? event.name ?? 'tool'
}

function parseJsonString(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function toolCallValue(event: ConversationTurnEventResponse): Record<string, unknown> {
  const firstToolCall = event.tool_calls?.[0]
  const fn = (firstToolCall?.function as Record<string, unknown> | undefined) ?? {}
  const args = fn.arguments
  return {
    id: firstToolCall?.id ?? event.message_id,
    type: firstToolCall?.type ?? 'function',
    function: {
      name: toolName(event),
      arguments: typeof args === 'string' ? parseJsonString(args) : (args ?? event.content ?? ''),
    },
  }
}

function toolResultValue(event: ConversationTurnEventResponse): Record<string, unknown> {
  const content = event.content ?? ''
  return {
    tool_call_id: event.tool_call_id,
    name: event.name ?? 'tool',
    content: parseJsonString(content),
  }
}

interface AssistantReference {
  paperId: string
  label: string
}

function splitAssistantContent(content: string | null | undefined): {
  body: string
  references: AssistantReference[]
} {
  const raw = (content ?? '').trim()
  if (!raw) return { body: '', references: [] }

  const markerMatch = raw.match(/\n(?:参考文献|References)\s*:\s*\n([\s\S]+)$/i)
  if (!markerMatch) {
    return { body: raw, references: [] }
  }

  const refsBlock = markerMatch[1]
  const references = refsBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ''))
    .map((line) => {
      const pipeIdx = line.indexOf('|')
      const paperId = (pipeIdx === -1 ? line : line.slice(0, pipeIdx)).trim()
      const label = (pipeIdx === -1 ? line : line.slice(pipeIdx + 1)).trim()
      if (!paperId.startsWith('pap-')) return null
      return {
        paperId,
        label: label || paperId,
      }
    })
    .filter((item): item is AssistantReference => item !== null)

  if (!references.length) {
    return { body: raw, references: [] }
  }

  return {
    body: raw.slice(0, markerMatch.index).trim(),
    references,
  }
}

function openPaperReference(paperId: string): void {
  uiStore.openRightDrawer('paper', { paperId }, 'local')
  emit('openPaper', paperId)
}
</script>

<template>
  <div
    class="animate-slide-in-left group border-ppx-border border-b px-4 py-5"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="mx-auto max-w-3xl space-y-3">
      <template v-if="events.length > 0">
        <template v-for="event in events" :key="event.message_id">
          <div v-if="event.message_kind === 'assistant_reasoning'" class="space-y-2">
            <div class="text-ppx-text-soft flex items-center gap-2 px-1 text-xs font-medium">
              <BrainCircuit class="h-3.5 w-3.5" />
              <span>{{ t('chat.reasoning') }}</span>
            </div>
            <details
              class="reasoning-panel workspace-panel-inset overflow-hidden"
              :open="isStreaming"
            >
              <summary
                class="border-ppx-border flex cursor-pointer list-none items-center justify-between border-b px-3 py-2.5"
              >
                <div
                  class="text-ppx-text inline-flex items-center gap-1.5 text-left text-sm font-semibold tracking-tight"
                >
                  <ChevronDown class="reasoning-chevron-open text-ppx-text-muted h-4 w-4" />
                  <ChevronRight class="reasoning-chevron-closed text-ppx-text-muted h-4 w-4" />
                  <span>{{ t('chat.reasoning') }}</span>
                </div>
              </summary>
              <div
                class="bg-ppx-bg-inset/72 text-ppx-text-soft px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              >
                {{ event.content ?? '' }}
              </div>
            </details>
          </div>

          <div v-else-if="event.message_kind === 'assistant_tool_call'" class="space-y-2">
            <div class="text-ppx-text-soft flex items-center gap-2 px-1 text-xs font-medium">
              <Wrench class="h-3.5 w-3.5" />
              <span>{{ t('chat.toolCalls') }}</span>
            </div>
            <JsonPanel :title="toolName(event)" :value="toolCallValue(event)" max-height="18rem" />
          </div>

          <div v-else-if="event.message_kind === 'tool_result'" class="space-y-2">
            <div class="text-ppx-text-soft flex items-center gap-2 px-1 text-xs font-medium">
              <LoaderCircle
                class="h-3.5 w-3.5"
                :class="{ 'text-ppx-accent animate-spin': isStreaming && isToolCalling }"
              />
              <span>{{ t('chat.toolResults') }}</span>
            </div>
            <JsonPanel
              :title="event.name ?? 'tool'"
              :value="toolResultValue(event)"
              max-height="18rem"
            />
          </div>

          <div
            v-else-if="event.message_kind === 'assistant_final'"
            class="text-ppx-text text-base leading-relaxed"
          >
            <template v-if="editing">
              <div class="workspace-panel-inset rounded-ppx-panel px-4 py-3">
                <textarea
                  v-model="editContent"
                  rows="6"
                  class="workspace-textarea min-h-0 w-full resize-y border-0 bg-transparent px-0 py-0 text-base leading-relaxed shadow-none"
                  @keydown.esc="emit('cancelEdit')"
                  @keydown.meta.enter.prevent="emit('confirmEdit')"
                  @keydown.ctrl.enter.prevent="emit('confirmEdit')"
                />
                <div class="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    class="workspace-icon-button h-7 w-7"
                    @click="emit('cancelEdit')"
                  >
                    <X class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="workspace-icon-button h-7 w-7"
                    @click="emit('confirmEdit')"
                  >
                    <Check class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <MarkdownContent :markdown="splitAssistantContent(event.content).body" />
              <div
                v-if="splitAssistantContent(event.content).references.length > 0"
                class="mt-3 space-y-2"
              >
                <div class="text-ppx-text-soft text-xs font-medium">
                  {{ t('chat.references') }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="reference in splitAssistantContent(event.content).references"
                    :key="reference.paperId"
                    type="button"
                    class="workspace-chip cursor-pointer text-left"
                    @click="openPaperReference(reference.paperId)"
                  >
                    {{ reference.paperId }} | {{ reference.label }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </template>
      </template>

      <div v-else-if="isStreaming" class="text-ppx-text-soft flex items-center gap-3 px-1 py-2">
        <div class="flex gap-1">
          <span class="bg-ppx-text-muted h-2 w-2 animate-bounce rounded-full" />
          <span class="bg-ppx-text-muted h-2 w-2 animate-bounce rounded-full delay-150" />
          <span class="bg-ppx-text-muted h-2 w-2 animate-bounce rounded-full delay-300" />
        </div>
        <span class="text-sm">{{ t('chat.thinking') }}</span>
      </div>

      <div
        v-if="events.length > 0"
        class="text-ppx-text-soft flex items-center justify-end gap-2 text-xs"
      >
        <span v-if="isStreaming && isToolCalling">{{ t('chat.toolCalling') }}</span>
        <ChatTurnActions
          :visible="hovered && !isStreaming"
          align="end"
          @edit="emit('edit')"
          @rerun="emit('rerun')"
          @delete="emit('delete')"
          @fork="emit('fork')"
        />
        <span>{{ formatTime(events[events.length - 1]?.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reasoning-panel .reasoning-chevron-open {
  display: none;
}

.reasoning-panel[open] .reasoning-chevron-open {
  display: block;
}

.reasoning-panel[open] .reasoning-chevron-closed {
  display: none;
}
</style>
