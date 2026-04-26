<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import CopyableText from '../CopyableText.vue'
import SortButton from '../SortButton.vue'
import TaskStatusBadge from './TaskStatusBadge.vue'
import type { DataProcessTaskResponse } from '../../types/api'
import type { SortOrder, TaskSortKey } from '../../types/sort'
import { formatDateTime } from '../../utils/format'

const selectedTaskId = defineModel<string | null>('selectedTaskId')

const props = defineProps<{
    tasks: DataProcessTaskResponse[]
    offset: number
    sortOrder: SortOrder,
    sortBy: TaskSortKey
}>()

const emit = defineEmits<{
    sort: [field: TaskSortKey]
}>()

const { t } = useI18n()
</script>

<template>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <th class="px-3 py-2">#</th>
                    <th class="px-3 py-2">{{ t('tasks.table.taskId') }}</th>
                    <th class="px-3 py-2">{{ t('tasks.table.paperId') }}</th>
                    <th class="min-w-24 px-3 py-2">
                        <SortButton :label="t('tasks.table.status')" :active="sortBy === 'status'"
                            :order="sortBy === 'status' ? props.sortOrder : 'default'"
                            @click="emit('sort', 'status')" />
                    </th>
                    <th class="min-w-28 px-3 py-2">
                        <SortButton :label="t('tasks.table.created')" :active="sortBy === 'created_at'"
                            :order="sortBy === 'created_at' ? props.sortOrder : 'default'"
                            @click="emit('sort', 'created_at')" />
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="(task, index) in props.tasks" :key="task.task_id"
                    class="cursor-pointer align-top transition-colors hover:bg-sky-50/60 dark:hover:bg-slate-800/70"
                    :class="task.task_id === selectedTaskId ? 'bg-sky-50 dark:bg-sky-900/20' : ''"
                    @click="selectedTaskId = task.task_id">
                    <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                        {{ props.offset + index + 1 }}
                    </td>
                    <td class="px-3 py-2 font-mono text-xs">{{ task.task_id }}</td>
                    <td class="px-3 py-2">
                        <CopyableText :text="task.paper_id" mono />
                    </td>
                    <td class="px-3 py-2">
                        <TaskStatusBadge :status="task.status" />
                    </td>
                    <td class="px-3 py-2 text-xs">{{ formatDateTime(task.created_at) }}</td>
                </tr>
                <tr v-if="props.tasks.length === 0">
                    <td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        {{ t('tasks.empty') }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
