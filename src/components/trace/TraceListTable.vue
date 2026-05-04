<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import CopyableText from '../CopyableText.vue'
import SortButton from '../SortButton.vue'
import type { AgentTraceResponse } from '@/types/api'
import type { SortOrder, TraceSortKey } from '@/types/sort'
import { formatDateTime } from '@/utils/format'

const selectedTraceId = defineModel<string | null>('selectedTraceId')

const props = defineProps<{
  traces: AgentTraceResponse[]
  offset: number
  sortOrder: SortOrder
  sortBy: TraceSortKey
}>()

const emit = defineEmits<{
  sort: [field: TraceSortKey]
  open: [traceId: string]
  close: []
}>()

const { t } = useI18n()

function handleToggle(traceId: string): void {
  if (selectedTraceId.value === traceId) {
    selectedTraceId.value = null
    emit('close')
  } else {
    selectedTraceId.value = traceId
    emit('open', traceId)
  }
}
</script>

<template>
  <section class="workspace-table-shell">
    <div class="border-ppx-border border-b px-4 py-3">
      <h3 class="text-ppx-text text-xl font-semibold tracking-tight">
        {{ t('traces.title') }}
      </h3>
    </div>
    <table class="workspace-table">
      <thead>
        <tr class="text-ppx-text-muted text-left text-sm font-semibold tracking-tight uppercase">
          <th class="px-3 py-2">#</th>
          <th class="px-3 py-2">{{ t('traces.table.traceId') }}</th>
          <th class="px-3 py-2">
            <SortButton
              :label="t('traces.table.agent')"
              :active="sortBy === 'agent_name'"
              :order="sortBy === 'agent_name' ? props.sortOrder : 'default'"
              @click="emit('sort', 'agent_name')"
            />
          </th>
          <th class="px-3 py-2">
            <SortButton
              :label="t('traces.table.model')"
              :active="sortBy === 'llm_model'"
              :order="sortBy === 'llm_model' ? props.sortOrder : 'default'"
              @click="emit('sort', 'llm_model')"
            />
          </th>
          <th class="px-3 py-2">{{ t('traces.table.caller') }}</th>
          <th class="px-3 py-2">{{ t('traces.table.callerId') }}</th>
          <th class="px-3 py-2">
            <SortButton
              :label="t('traces.table.totalTokens')"
              :active="sortBy === 'total_tokens'"
              :order="sortBy === 'total_tokens' ? props.sortOrder : 'default'"
              @click="emit('sort', 'total_tokens')"
            />
          </th>
          <th class="min-w-24 px-3 py-2">
            <SortButton
              :label="t('traces.table.created')"
              :active="sortBy === 'created_at'"
              :order="sortBy === 'created_at' ? props.sortOrder : 'default'"
              @click="emit('sort', 'created_at')"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(trace, index) in props.traces"
          :key="trace.trace_id"
          class="workspace-row-hover cursor-pointer align-top"
          :class="trace.trace_id === selectedTraceId ? 'workspace-row-selected' : ''"
          @click="handleToggle(trace.trace_id)"
        >
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ props.offset + index + 1 }}
          </td>
          <td class="px-3 py-2">
            <CopyableText :text="trace.trace_id" mono />
          </td>
          <td class="px-3 py-2">
            <span class="workspace-badge workspace-badge--neutral">{{ trace.agent_name }}</span>
          </td>
          <td class="px-3 py-2 text-sm">{{ trace.llm_model ?? '-' }}</td>
          <td class="px-3 py-2 text-sm">
            <span v-if="trace.caller" class="workspace-badge workspace-badge--neutral">{{
              trace.caller
            }}</span>
            <span v-else class="workspace-muted">-</span>
          </td>
          <td class="px-3 py-2 text-sm">
            <CopyableText v-if="trace.caller_id" :text="trace.caller_id" mono />
            <span v-else class="workspace-muted">-</span>
          </td>
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ trace.total_tokens?.toLocaleString() ?? '-' }}
          </td>
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ formatDateTime(trace.created_at) }}
          </td>
        </tr>
        <tr v-if="props.traces.length === 0">
          <td colspan="8" class="workspace-table-empty text-center">
            {{ t('traces.empty') }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
