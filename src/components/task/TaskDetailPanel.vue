<script setup lang="ts">
import {
    Ban,
    ExternalLink,
    RotateCcw,
    Trash2,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import JsonPanel from '../JsonPanel.vue'
import type { DataProcessTaskResponse } from '../../types/api'
import { formatDateTime } from '../../utils/format'

const props = defineProps<{
    task: DataProcessTaskResponse
    canCancel: boolean
    canRetry: boolean
    canDelete: boolean
}>()

const emit = defineEmits<{
    cancel: [taskId: string]
    retry: [taskId: string]
    delete: [taskId: string]
}>()

const { t } = useI18n()
</script>

<template>
    <aside
        class="self-start rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
        <header class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ t('tasks.detail.title') }}</h3>
            <RouterLink :to="`/tasks/${props.task.task_id}`"
                class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <ExternalLink class="h-3.5 w-3.5" />
                <span>{{ t('actions.open') }}</span>
            </RouterLink>
        </header>
        <div class="mb-3 flex flex-wrap gap-2">
            <AppButton tone="amber" size="xs" :disabled="!props.canCancel" @click="emit('cancel', props.task.task_id)">
                <Ban class="h-3.5 w-3.5" />
                <span>{{ t('actions.cancel') }}</span>
            </AppButton>
            <AppButton tone="sky" size="xs" :disabled="!props.canRetry" @click="emit('retry', props.task.task_id)">
                <RotateCcw class="h-3.5 w-3.5" />
                <span>{{ t('actions.retry') }}</span>
            </AppButton>
            <AppButton tone="rose" size="xs" :disabled="!props.canDelete" @click="emit('delete', props.task.task_id)">
                <Trash2 class="h-3.5 w-3.5" />
                <span>{{ t('actions.delete') }}</span>
            </AppButton>
        </div>
        <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.taskId') }}:</span>
                {{ props.task.task_id }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.paperId') }}:</span>
                {{ props.task.paper_id }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.status') }}:</span>
                {{ t(`status.${props.task.status}`) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.retryOf') }}:</span>
                {{ props.task.retry_of_task_id ?? '-' }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.created') }}:</span>
                {{ formatDateTime(props.task.created_at) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.started') }}:</span>
                {{ formatDateTime(props.task.started_at) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.finished') }}:</span>
                {{ formatDateTime(props.task.finished_at) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.error') }}:</span>
                {{ props.task.error ?? '-' }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                t('tasks.detail.extractionTraceCount') }}:</span> {{
                        props.task.extraction_trace_ids.length }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.analysisTraceCount')
            }}:</span> {{
                        props.task.analysis_trace_ids.length }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                t('tasks.detail.extractionFactCheckTraceCount') }}:</span> {{
                        props.task.extraction_fact_check_trace_ids.length }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                t('tasks.detail.analysisFactCheckTraceCount') }}:</span> {{
                        props.task.analysis_fact_check_trace_ids.length }}</div>
        </div>
        <div class="mt-3">
            <JsonPanel :title="t('tasks.detail.rawTaskJson')" :value="props.task" max-height="36vh" defaultOpen />
        </div>
    </aside>
</template>
