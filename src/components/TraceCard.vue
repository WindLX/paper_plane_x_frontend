<script setup lang="ts">
import { MessageSquareText, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import TraceMessageRenderer from './TraceMessageRenderer.vue'
import JsonPanel from './JsonPanel.vue'
import type { AgentTraceResponse } from '../types/api'
import { formatDateTime } from '../utils/format'

const props = defineProps<{
  trace: AgentTraceResponse
  defaultOpen?: boolean
}>()

const { t } = useI18n()
const emit = defineEmits<{
  delete: [traceId: string]
}>()
</script>

<template>
  <details :open="Boolean(defaultOpen)"
    class="trace-card rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/40">
    <summary class="trace-card-summary block cursor-pointer list-none pb-2">
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
          <div>{{ t('trace.model') }}: {{ trace.llm_model ?? '-' }}</div>
          <div>{{ t('trace.promptTokens') }}: {{ trace.prompt_tokens ?? '-' }}</div>
          <div>{{ t('trace.completionTokens') }}: {{ trace.completion_tokens ?? '-' }}</div>
          <div>{{ t('trace.totalTokens') }}: {{ trace.total_tokens ?? '-' }}</div>
          <div>{{ t('trace.created') }}: {{ formatDateTime(trace.created_at) }}</div>
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
          <JsonPanel :title="t('trace.rawUsagePayload')" :value="trace.usage_payload" pre-wrap />
        </div>
        <AppButton tone="rose" size="md" @click="emit('delete', props.trace.trace_id)">
          <Trash2 class="h-3.5 w-3.5" />
          <span>{{ t('actions.delete') }}</span>
        </AppButton>
      </div>
    </div>
  </details>
</template>

<style scoped>
.trace-card-summary {
  border-bottom: 1px solid transparent;
}

.trace-card[open] .trace-card-summary {
  border-bottom-color: rgb(226 232 240);
}

.dark .trace-card[open] .trace-card-summary {
  border-bottom-color: rgb(51 65 85);
}
</style>
