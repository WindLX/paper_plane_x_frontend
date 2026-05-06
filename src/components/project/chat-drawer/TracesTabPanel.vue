<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import TraceCard from '@/components/trace/TraceCard.vue'
import VirtualScrollList from '@/components/VirtualScrollList.vue'
import type { AgentTraceResponse } from '@/types/api'

defineProps<{
  traceIds: string[]
  traces: Record<string, AgentTraceResponse>
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex shrink-0 items-center justify-between gap-2 pb-3">
      <h3 class="workspace-section-title">{{ t('traces.agentTraces') }}</h3>
      <span class="workspace-chip">{{ traceIds.length }}</span>
    </header>
    <VirtualScrollList :items="traceIds" class="animate-stagger min-h-0 flex-1 space-y-3">
      <template #above="{ count }">
        {{ t('traces.moreAbove', { count }) }}
      </template>
      <template #default="{ item: traceId }">
        <TraceCard v-if="traces[traceId]" :trace="traces[traceId]" :default-open="false" />
      </template>
      <template #below="{ count }">
        {{ t('traces.moreBelow', { count }) }}
      </template>
    </VirtualScrollList>
  </div>
</template>
