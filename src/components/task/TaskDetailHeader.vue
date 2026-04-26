<script setup lang="ts">
import { ArrowLeft, Ban, RotateCcw, Trash2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import TaskStatusBadge from './TaskStatusBadge.vue'
import type { DataProcessTaskResponse } from '../../types/api'

const props = defineProps<{
    taskId: string
    task?: DataProcessTaskResponse
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
    <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
            <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold">{{ t('taskDetail.title') }}</h2>
                <TaskStatusBadge v-if="props.task" :status="props.task.status" />
            </div>
            <p class="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{{ props.taskId }}</p>
        </div>
        <div class="flex items-center gap-2">
            <RouterLink to="/tasks"
                class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                <ArrowLeft class="h-4 w-4" />
                <span>{{ t('actions.back') }}</span>
            </RouterLink>
            <AppButton v-if="props.task" tone="amber" size="md" :disabled="!props.canCancel"
                @click="emit('cancel', props.task.task_id)">
                <Ban class="h-4 w-4" />
                <span>{{ t('actions.cancel') }}</span>
            </AppButton>
            <AppButton v-if="props.task" tone="sky" size="md" :disabled="!props.canRetry"
                @click="emit('retry', props.task.task_id)">
                <RotateCcw class="h-4 w-4" />
                <span>{{ t('actions.retry') }}</span>
            </AppButton>
            <AppButton v-if="props.task" tone="rose" size="md" :disabled="!props.canDelete"
                @click="emit('delete', props.task.task_id)">
                <Trash2 class="h-4 w-4" />
                <span>{{ t('actions.delete') }}</span>
            </AppButton>
        </div>
    </header>
</template>
