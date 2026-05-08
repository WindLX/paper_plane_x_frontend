<script setup lang="ts">
import { BrainCircuit, ChevronDown, ChevronRight, LoaderCircle, Square, Wrench } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import JsonPanel from '@/components/JsonPanel.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import ChatTurnActions from './ChatTurnActions.vue'
import type { ConversationTurnEventResponse, ConversationTurnResponse } from '@/types/api'

const props = defineProps<{
  turn: ConversationTurnResponse
  isStreaming: boolean
  isToolCalling: boolean
  streamPhase?: 'idle' | 'reasoning' | 'tool_calling' | 'finalizing'
  pendingStop?: boolean
  forkLoading?: boolean
}>()

const emit = defineEmits<{
  rerun: []
  delete: []
  fork: []
  stopStream: []
  openPaper: [paperId: string]
}>()

const { t } = useI18n()
const hovered = ref(false)

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

function openPaperReference(paperId: string): void {
  emit('openPaper', paperId)
}

const showStreamingIndicator = computed(
  () => props.isStreaming && (events.value.length === 0 || props.streamPhase !== 'idle'),
)
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
              <span>{{ t('projects.chatView.reasoning') }}</span>
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
                  <span>{{ t('projects.chatView.reasoning') }}</span>
                </div>
              </summary>
              <div
                class="bg-ppx-bg-inset/72 px-3 py-2.5"
              >
                <MarkdownContent
                  :markdown="event.reasoning_content ?? event.content ?? ''"
                  @paper-click="openPaperReference($event)"
                />
              </div>
            </details>
          </div>

          <div v-else-if="event.message_kind === 'assistant_tool_call'" class="space-y-2">
            <div class="text-ppx-text-soft flex items-center gap-2 px-1 text-xs font-medium">
              <Wrench class="h-3.5 w-3.5" />
              <span>{{ t('projects.chatView.toolCalls') }}</span>
            </div>
            <JsonPanel :title="toolName(event)" :value="toolCallValue(event)" max-height="18rem" />
          </div>

          <div v-else-if="event.message_kind === 'tool_result'" class="space-y-2">
            <div class="text-ppx-text-soft flex items-center gap-2 px-1 text-xs font-medium">
              <LoaderCircle
                class="h-3.5 w-3.5"
                :class="{ 'text-ppx-accent animate-spin': isStreaming && isToolCalling }"
              />
              <span>{{ t('projects.chatView.toolResults') }}</span>
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
            <MarkdownContent
              :markdown="event.content ?? ''"
              @paper-click="openPaperReference($event)"
            />
          </div>
        </template>
      </template>

      <div
        v-else-if="showStreamingIndicator"
        class="text-ppx-text-soft flex items-center gap-3 px-1 py-2"
      >
        <div class="flex gap-1">
          <span class="bg-ppx-text-muted h-2 w-2 animate-bounce rounded-full" />
          <span class="bg-ppx-text-muted h-2 w-2 animate-bounce rounded-full delay-150" />
          <span class="bg-ppx-text-muted h-2 w-2 animate-bounce rounded-full delay-300" />
        </div>
        <span class="text-sm">
          {{
            props.streamPhase === 'tool_calling'
              ? t('projects.chatView.toolCalling')
              : t('projects.chatView.generating')
          }}
        </span>
      </div>

      <div
        v-if="events.length > 0 || showStreamingIndicator"
        class="text-ppx-text-soft flex items-center justify-end gap-2 text-xs"
      >
        <div v-if="showStreamingIndicator" class="mr-auto flex items-center gap-1.5">
          <LoaderCircle class="text-ppx-accent h-3.5 w-3.5 animate-spin" />
          <span>
            {{
              props.streamPhase === 'tool_calling'
                ? t('projects.chatView.toolCalling')
                : t('projects.chatView.generating')
            }}
          </span>
        </div>
        <button
          v-if="props.isStreaming"
          type="button"
          class="workspace-icon-button h-8 w-8"
          :title="t('projects.chatView.stop')"
          :disabled="props.pendingStop"
          @click="emit('stopStream')"
        >
          <LoaderCircle v-if="props.pendingStop" class="h-4 w-4 animate-spin" />
          <Square v-else class="h-4 w-4" />
        </button>
        <div v-if="props.isStreaming && props.pendingStop" class="text-ppx-text-muted text-xs">
          {{ t('projects.chatView.stopping') }}
        </div>
        <ChatTurnActions
          :visible="hovered && !isStreaming"
          align="end"
          :show-edit="false"
          :fork-loading="props.forkLoading"
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
