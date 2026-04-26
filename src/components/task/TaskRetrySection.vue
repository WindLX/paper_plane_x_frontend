<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import TaskStatusBadge from './TaskStatusBadge.vue'
import type { DataProcessTaskResponse } from '../../types/api'

const props = defineProps<{
    task: DataProcessTaskResponse
    retrySourceTask?: DataProcessTaskResponse
    retryChildren: DataProcessTaskResponse[]
    retryChildrenLoading: boolean
}>()

const { t } = useI18n()
</script>

<template>
    <section class="grid gap-3 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ t('taskDetail.retrySource') }}</h3>
            <div v-if="props.task.retry_of_task_id" class="mt-2">
                <RouterLink :to="`/tasks/${props.task.retry_of_task_id}`"
                    class="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800">
                    <span class="font-mono text-sky-700 hover:underline dark:text-sky-300">{{
                        props.task.retry_of_task_id }}</span>
                    <TaskStatusBadge v-if="props.retrySourceTask" :status="props.retrySourceTask.status" />
                </RouterLink>
            </div>
            <div v-else class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ t('common.none') }}</div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ t('taskDetail.retryChildren') }}
            </h3>
            <div v-if="props.retryChildrenLoading" class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{
                t('common.loading') }}</div>
            <div v-else-if="props.retryChildren.length === 0" class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{
                t('common.none') }}</div>
            <div v-else class="mt-2 space-y-1">
                <RouterLink v-for="child in props.retryChildren" :key="child.task_id" :to="`/tasks/${child.task_id}`"
                    class="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800">
                    <span class="font-mono text-sky-700 hover:underline dark:text-sky-300">{{ child.task_id }}</span>
                    <TaskStatusBadge :status="child.status" />
                </RouterLink>
            </div>
        </div>
    </section>
</template>
