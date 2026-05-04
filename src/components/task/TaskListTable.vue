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
  sortOrder: SortOrder
  sortBy: TaskSortKey
}>()

const emit = defineEmits<{
  sort: [field: TaskSortKey]
  open: [taskId: string]
  close: []
}>()

const { t } = useI18n()

function handleToggle(taskId: string): void {
  if (selectedTaskId.value === taskId) {
    selectedTaskId.value = null
    emit('close')
  } else {
    selectedTaskId.value = taskId
    emit('open', taskId)
  }
}
</script>

<template>
  <section class="workspace-table-shell">
    <div class="border-ppx-border border-b px-4 py-3">
      <h3 class="text-ppx-text text-xl font-semibold tracking-tight">
        {{ t('tasks.title') }}
      </h3>
    </div>
    <table class="workspace-table">
      <thead>
        <tr class="text-ppx-text-muted text-left text-sm font-semibold tracking-tight uppercase">
          <th class="px-3 py-2">#</th>
          <th class="px-3 py-2">{{ t('tasks.table.taskId') }}</th>
          <th class="px-3 py-2">{{ t('tasks.table.paperId') }}</th>
          <th class="min-w-24 px-3 py-2">
            <SortButton
              :label="t('tasks.table.status')"
              :active="sortBy === 'status'"
              :order="sortBy === 'status' ? props.sortOrder : 'default'"
              @click="emit('sort', 'status')"
            />
          </th>
          <th class="min-w-28 px-3 py-2">
            <SortButton
              :label="t('tasks.table.created')"
              :active="sortBy === 'created_at'"
              :order="sortBy === 'created_at' ? props.sortOrder : 'default'"
              @click="emit('sort', 'created_at')"
            />
          </th>
          <th class="min-w-28 px-3 py-2">
            <SortButton
              :label="t('tasks.table.started')"
              :active="sortBy === 'started_at'"
              :order="sortBy === 'started_at' ? props.sortOrder : 'default'"
              @click="emit('sort', 'started_at')"
            />
          </th>
          <th class="min-w-28 px-3 py-2">
            <SortButton
              :label="t('tasks.table.finished')"
              :active="sortBy === 'finished_at'"
              :order="sortBy === 'finished_at' ? props.sortOrder : 'default'"
              @click="emit('sort', 'finished_at')"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(task, index) in props.tasks"
          :key="task.task_id"
          class="workspace-row-hover cursor-pointer align-top"
          :class="task.task_id === selectedTaskId ? 'workspace-row-selected' : ''"
          @click="handleToggle(task.task_id)"
        >
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ props.offset + index + 1 }}
          </td>
          <td class="px-3 py-2">
            <CopyableText :text="task.task_id" mono />
          </td>
          <td class="px-3 py-2">
            <CopyableText :text="task.paper_id" mono />
          </td>
          <td class="px-3 py-2">
            <TaskStatusBadge :status="task.status" />
          </td>
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ formatDateTime(task.created_at) }}
          </td>
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ task.started_at ? formatDateTime(task.started_at) : '-' }}
          </td>
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ task.finished_at ? formatDateTime(task.finished_at) : '-' }}
          </td>
        </tr>
        <tr v-if="props.tasks.length === 0">
          <td colspan="7" class="workspace-table-empty text-center">
            {{ t('tasks.empty') }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
