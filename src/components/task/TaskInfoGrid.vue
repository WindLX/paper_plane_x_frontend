<script setup lang="ts">
import CopyableText from '../CopyableText.vue'
import TaskStatusBadge from './TaskStatusBadge.vue'
import type { DataProcessTaskResponse } from '../../types/api'
import { formatDateTime } from '../../utils/format'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    task: DataProcessTaskResponse
}>()

const { t } = useI18n()
</script>

<template>
    <section
        class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2 lg:grid-cols-3">
        <div><span class="text-xs text-slate-500">{{ t('tasks.table.taskId') }}</span>
            <div class="font-mono text-xs">{{ props.task.task_id }}</div>
        </div>
        <div><span class="text-xs text-slate-500">{{ t('tasks.table.paperId') }}</span>
            <div class="text-xs">
                <CopyableText :text="props.task.paper_id" mono />
            </div>
        </div>
        <div><span class="text-xs text-slate-500">{{ t('tasks.table.status') }}</span>
            <div>
                <TaskStatusBadge :status="props.task.status" />
            </div>
        </div>
        <div><span class="text-xs text-slate-500">{{ t('tasks.table.created') }}</span>
            <div class="text-sm">{{ formatDateTime(props.task.created_at) }}</div>
        </div>
        <div><span class="text-xs text-slate-500">{{ t('tasks.detail.started') }}</span>
            <div class="text-sm">{{ formatDateTime(props.task.started_at) }}</div>
        </div>
        <div><span class="text-xs text-slate-500">{{ t('tasks.detail.finished') }}</span>
            <div class="text-sm">{{ formatDateTime(props.task.finished_at) }}</div>
        </div>
        <div class="md:col-span-2 lg:col-span-3">
            <span class="text-xs text-slate-500">{{ t('tasks.detail.error') }}</span>
            <div class="text-sm text-rose-700 dark:text-rose-300">{{ props.task.error ?? '-' }}</div>
        </div>
    </section>
</template>
