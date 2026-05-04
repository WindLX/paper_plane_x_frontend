<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import JsonPanel from '../JsonPanel.vue'
import TraceCard from '../trace/TraceCard.vue'
import type { AgentTraceResponse } from '@/types/api'

interface TraceSection {
  key: string
  title: string
  ids: string[]
  entries: { traceId: string; trace: AgentTraceResponse | null }[]
}

const props = defineProps<{
  sections: TraceSection[]
  traceStoreError?: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <section class="space-y-3.5">
    <header class="flex items-center justify-between gap-2">
      <h3 class="workspace-section-title">
        {{ t('taskDetail.agentTraces') }}
      </h3>
      <span class="workspace-chip">{{ props.sections.length }}</span>
    </header>

    <div
      v-if="props.traceStoreError"
      class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs"
    >
      {{ props.traceStoreError }}
    </div>

    <details
      v-for="(section, sectionIndex) in props.sections"
      :key="section.key"
      :open="sectionIndex === 0"
      class="workspace-panel overflow-hidden p-0"
    >
      <summary class="cursor-pointer list-none px-3.5 py-3">
        <div class="flex items-center justify-between gap-3">
          <h4 class="workspace-section-title text-sm">
            {{ section.title }}
          </h4>
          <span class="workspace-meta text-xs tracking-normal normal-case">
            {{
              t('taskDetail.traceCounter', {
                loaded: section.entries.filter((item) => item.trace !== null).length,
                total: section.ids.length,
              })
            }}
          </span>
        </div>
      </summary>
      <div class="border-ppx-border space-y-3 border-t px-3.5 py-3">
        <div
          v-if="section.ids.length === 0"
          class="workspace-subpanel text-ppx-text-muted px-3 py-2 font-mono text-xs"
        >
          []
        </div>
        <template v-else>
          <JsonPanel
            :title="t('taskDetail.traceIdsTitle', { sectionTitle: section.title })"
            :value="section.ids"
          />
          <div v-if="section.entries.length === 0" class="workspace-body">
            {{ t('taskDetail.noTracePayload') }}
          </div>
          <template v-for="(entry, traceIndex) in section.entries" :key="entry.traceId">
            <TraceCard v-if="entry.trace" :trace="entry.trace" :default-open="traceIndex === 0" />
            <div v-else class="workspace-badge--warning rounded-ppx-interactive border p-3">
              <div
                class="mb-1 inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase"
              >
                <AlertTriangle class="h-3.5 w-3.5" />
                <span>{{ t('taskDetail.missingTrace') }}</span>
              </div>
              <div class="font-mono text-xs">{{ entry.traceId }}</div>
              <p class="mt-1 text-xs opacity-90">
                {{ t('taskDetail.missingTraceHint') }}
              </p>
            </div>
          </template>
        </template>
      </div>
    </details>
  </section>
</template>
