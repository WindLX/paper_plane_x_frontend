<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppCheckbox from '../AppCheckbox.vue'
import AppTable from '../AppTable.vue'
import CopyableText from '../CopyableText.vue'
import SortButton from '../SortButton.vue'
import TaskStatusBadge from './TaskStatusBadge.vue'
import type { DataProcessTaskResponse } from '@/types/api'
import type { SortOrder, TaskSortKey } from '@/types/sort'
import { formatDateTime } from '@/utils/format'

const selectedTaskId = defineModel<string | null>('selectedTaskId')

const props = defineProps<{
  tasks: DataProcessTaskResponse[]
  offset: number
  sortOrder: SortOrder
  sortBy: TaskSortKey
  selectedIds: string[]
  selectionDisabled?: boolean
}>()

const emit = defineEmits<{
  sort: [field: TaskSortKey]
  open: [taskId: string]
  close: []
  'toggle-select': [taskId: string]
  'toggle-select-all': []
}>()

const { t } = useI18n()

const selectedIdSet = computed(() => new Set(props.selectedIds))
const pageIds = computed(() => props.tasks.map((task) => task.task_id))
const allSelected = computed(
  () => pageIds.value.length > 0 && pageIds.value.every((id) => selectedIdSet.value.has(id)),
)
const partiallySelected = computed(
  () => pageIds.value.some((id) => selectedIdSet.value.has(id)) && !allSelected.value,
)
const pageSelectionDisabled = computed(() => props.selectionDisabled || props.tasks.length === 0)

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
  <AppTable :title="t('tasks.title')">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <table class="workspace-table">
      <thead>
        <tr class="text-ppx-text-muted text-left text-sm font-semibold tracking-tight uppercase">
          <th class="px-3 py-2">#</th>
          <th class="w-10 px-3 py-2">
            <AppCheckbox
              :checked="allSelected"
              :indeterminate="partiallySelected"
              :disabled="pageSelectionDisabled"
              :label="t('bulk.selectPage')"
              :checked-label="t('bulk.selectPageAll')"
              :indeterminate-label="t('bulk.selectPagePartial')"
              :disabled-label="t('bulk.selectPageDisabled')"
              @click.stop="emit('toggle-select-all')"
            />
          </th>
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
          <td class="px-3 py-2" @click.stop>
            <AppCheckbox
              :checked="selectedIdSet.has(task.task_id)"
              :disabled="props.selectionDisabled"
              :label="t('bulk.selectRow', { id: task.task_id })"
              :checked-label="t('bulk.selectRowSelected', { id: task.task_id })"
              :disabled-label="t('bulk.selectRowDisabled', { id: task.task_id })"
              @click.stop="emit('toggle-select', task.task_id)"
            />
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
          <td colspan="8" class="workspace-table-empty text-center">
            {{ t('tasks.empty') }}
          </td>
        </tr>
      </tbody>
    </table>
  </AppTable>
</template>
