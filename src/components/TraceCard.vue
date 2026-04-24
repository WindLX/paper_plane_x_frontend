<script setup lang="ts">
import { MessageSquareText, Trash2 } from 'lucide-vue-next'

import AppButton from './AppButton.vue'
import TraceMessageRenderer from './TraceMessageRenderer.vue'
import JsonPanel from './JsonPanel.vue'
import type { AgentTraceResponse } from '../types/api'
import { formatDateTime } from '../utils/format'

const props = defineProps<{
  trace: AgentTraceResponse
  defaultOpen?: boolean
}>()

const emit = defineEmits<{
  delete: [traceId: string]
}>()
</script>

<template>
  <details :open="Boolean(defaultOpen)"
    class="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/40">
    <summary class="block cursor-pointer list-none border-b border-slate-200 pb-2 dark:border-slate-700">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <h4 class="truncate text-sm font-semibold text-slate-900 dark:text-slate-200">{{ trace.trace_id }}</h4>
            <span
              class="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {{ trace.agent_name }}
            </span>
          </div>
          <div class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MessageSquareText class="h-3.5 w-3.5" />
            <span>{{ trace.messages.length }}</span>
          </div>
        </div>
        <div class="grid gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-5">
          <div>Model: {{ trace.llm_model ?? '-' }}</div>
          <div>Prompt: {{ trace.prompt_tokens ?? '-' }}</div>
          <div>Completion: {{ trace.completion_tokens ?? '-' }}</div>
          <div>Total: {{ trace.total_tokens ?? '-' }}</div>
          <div>Created: {{ formatDateTime(trace.created_at) }}</div>
        </div>
      </div>
    </summary>

    <div class="mt-3 space-y-3">
      <div class="space-y-3">
        <TraceMessageRenderer v-for="(message, index) in trace.messages" :key="`${trace.trace_id}-${index}`"
          :message="message" :index="index + 1" />
      </div>

      <div class="flex items-center gap-2">
        <div class="min-w-0 flex-1">
          <JsonPanel title="Raw usage payload" :value="trace.usage_payload" pre-wrap />
        </div>
        <AppButton tone="rose" size="md" @click="emit('delete', props.trace.trace_id)">
          <Trash2 class="h-3.5 w-3.5" />
          <span>Delete</span>
        </AppButton>
      </div>
    </div>
  </details>
</template>
