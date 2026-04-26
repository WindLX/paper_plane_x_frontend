<script setup lang="ts">
import { ChevronDown, History } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import JsonPanel from '../JsonPanel.vue';
import type { ProjectResponse } from '../../types/api';

const props = defineProps<{
    project?: ProjectResponse
}>()

const { t } = useI18n()
</script>

<template>
    <details
        class="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary
            class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span class="inline-flex items-center gap-2">
                <History class="h-4 w-4" />
                <span>{{ t('projectDetail.operationLogs', { count: props.project?.operation_logs?.length ?? 0 })
                }}</span>
            </span>
            <ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div class="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <div v-if="!project || !project.operation_logs || project.operation_logs.length === 0"
                class="text-sm text-slate-500 dark:text-slate-400">
                {{ t('projectDetail.noOperationLogs') }}
            </div>
            <div v-else class="space-y-3">
                <JsonPanel v-for="(log, index) in project.operation_logs" :key="index"
                    :title="t('projectDetail.logTitle', { index: index + 1 })" :value="log" pre-wrap
                    :default-open="index === 0" max-height="18rem" />
            </div>
        </div>
    </details>
</template>