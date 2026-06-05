<script setup lang="ts">
import { ref } from 'vue'
import { MessageSquareText, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'
import TraceMessageRenderer from './TraceMessageRenderer.vue'
import JsonPanel from '../JsonPanel.vue'
import type { AgentTraceResponse } from '@/types/api'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  trace: AgentTraceResponse
  defaultOpen?: boolean
}>()

const emit = defineEmits<{
  delete: [traceId: string]
}>()

const { t } = useI18n()
const open = ref(Boolean(props.defaultOpen))

function handleToggle(event: Event): void {
  open.value = (event.currentTarget as HTMLDetailsElement).open
}
</script>

<template>
  <details
    :open="open"
    class="trace-card workspace-panel animate-fade-in-up overflow-hidden p-0"
    @toggle="handleToggle"
  >
    <summary class="trace-card-summary block cursor-pointer list-none px-4 py-3">
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <span class="workspace-badge workspace-badge--neutral shrink-0 text-xs">
              {{ trace.agent_name }}
            </span>
            <CopyableText :text="trace.trace_id" mono class="min-w-0" />
          </div>
          <div class="text-ppx-text-muted inline-flex shrink-0 items-center gap-1 text-xs">
            <MessageSquareText class="h-3.5 w-3.5" />
            <span>{{ trace.messages.length }}</span>
          </div>
        </div>
        <div class="text-ppx-text-muted grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
          <div class="min-w-0 truncate">
            <span class="text-ppx-text-muted font-semibold">{{ t('traces.model') }}:</span>
            {{ trace.llm_model ?? '-' }}
          </div>
          <div class="min-w-0 truncate">
            <span class="text-ppx-text-muted font-semibold">{{ t('traces.promptTokens') }}:</span>
            {{ trace.prompt_tokens ?? '-' }}
          </div>
          <div class="min-w-0 truncate">
            <span class="text-ppx-text-muted font-semibold"
              >{{ t('traces.completionTokens') }}:</span
            >
            {{ trace.completion_tokens ?? '-' }}
          </div>
          <div class="min-w-0 truncate">
            <span class="text-ppx-text-muted font-semibold">{{ t('traces.totalTokens') }}:</span>
            {{ trace.total_tokens ?? '-' }}
          </div>
          <div class="min-w-0 truncate">
            <span class="text-ppx-text-muted font-semibold">{{ t('traces.created') }}:</span>
            {{ formatDateTime(trace.created_at) }}
          </div>
        </div>
      </div>
    </summary>

    <div v-if="open" class="border-ppx-border space-y-3 border-t px-4 pt-3 pb-4">
      <div class="animate-stagger space-y-3">
        <template
          v-for="(message, index) in props.trace.messages"
          :key="`${props.trace.trace_id}-${index}`"
        >
          <TraceMessageRenderer :message="message" :index="index + 1" />
        </template>
      </div>

      <div class="space-y-3">
        <JsonPanel
          v-if="props.trace.tools && props.trace.tools.length > 0"
          :title="t('traces.tools')"
          :value="props.trace.tools"
        />
        <JsonPanel :title="t('traces.rawUsagePayload')" :value="props.trace.usage_payload" />
      </div>

      <div class="flex items-center gap-2">
        <div class="min-w-0 flex-1"></div>
        <AppButton
          variant="outline"
          tone="rose"
          size="md"
          @click="emit('delete', props.trace.trace_id)"
        >
          <Trash2 class="h-3.5 w-3.5" />
          <span>{{ t('traces.delete') }}</span>
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
  border-bottom-color: var(--ppx-border);
}
</style>
