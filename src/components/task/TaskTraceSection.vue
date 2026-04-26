<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import JsonPanel from '../JsonPanel.vue'
import TraceCard from '../trace/TraceCard.vue'
import type { AgentTraceResponse } from '../../types/api'

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

const emit = defineEmits<{
    deleteTrace: [traceId: string]
}>()

const { t } = useI18n()
</script>

<template>
    <section class="space-y-4">
        <header class="space-y-1">
            <h3 class="text-base font-semibold">{{ t('taskDetail.agentTraces') }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ t('taskDetail.agentTraceHint') }}
            </p>
        </header>

        <div v-if="props.traceStoreError"
            class="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
            {{ props.traceStoreError }}
        </div>

        <details v-for="(section, sectionIndex) in props.sections" :key="section.key" :open="sectionIndex === 0"
            class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <summary class="cursor-pointer list-none">
                <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ section.title }}</h4>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                        {{t('taskDetail.traceCounter', {
                            loaded: section.entries.filter((item) => item.trace !== null).length,
                            total: section.ids.length,
                        })}}
                    </span>
                </div>
            </summary>
            <div class="mt-3 space-y-3">
                <div v-if="section.ids.length === 0"
                    class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    []
                </div>
                <template v-else>
                    <JsonPanel :title="t('taskDetail.traceIdsTitle', { sectionTitle: section.title })"
                        :value="section.ids" />
                    <div v-if="section.entries.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
                        {{ t('taskDetail.noTracePayload') }}
                    </div>
                    <template v-for="(entry, traceIndex) in section.entries" :key="entry.traceId">
                        <TraceCard v-if="entry.trace" :trace="entry.trace" :default-open="traceIndex === 0"
                            @delete="emit('deleteTrace', $event)" />
                        <div v-else
                            class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                            <div
                                class="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
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
