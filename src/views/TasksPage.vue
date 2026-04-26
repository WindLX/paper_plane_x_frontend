<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../components/AppButton.vue'
import PagerBar from '../components/PagerBar.vue'
import SimpleSearchBar from '../components/SimpleSearchBar.vue'
import TaskDetailPanel from '../components/task/TaskDetailPanel.vue'
import TaskListTable from '../components/task/TaskListTable.vue'
import TaskQueueCards from '../components/task/TaskQueueCards.vue'
import { useDialog } from '../composables/dialog'
import { useNotify } from '../composables/notify'
import { useTaskStore } from '../stores/tasks'
import type { DataProcessTaskResponse } from '../types/api'
import { formatDateTime } from '../utils/format'

const taskStore = useTaskStore()
const dialog = useDialog()
const notify = useNotify()
const { t } = useI18n()
const lastErrorNotified = ref<string | null>(null)
const autoRefreshEnabled = ref(false)
const selectedTaskId = ref<string | null>(null)
const keyword = ref('')
let autoRefreshTimer: number | null = null

const filteredTasks = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return taskStore.tasks
  }
  return taskStore.tasks.filter((task) => {
    const haystacks = [
      task.task_id,
      task.paper_id,
      task.status,
      task.retry_of_task_id ?? '',
    ]
    return haystacks.some((item) => item.toLowerCase().includes(search))
  })
})

onMounted(async () => {
  await taskStore.fetchTasks({ offset: 0, limit: 20 })
})

onUnmounted(() => {
  if (autoRefreshTimer !== null) {
    window.clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

watch(
  () => filteredTasks.value,
  (items) => {
    if (items.length === 0) {
      selectedTaskId.value = null
      return
    }
    const exists = items.some((task) => task.task_id === selectedTaskId.value)
    if (!exists) {
      selectedTaskId.value = items[0].task_id
    }
  },
  { immediate: true },
)

watch(
  () => taskStore.error,
  (error) => {
    if (!error) {
      lastErrorNotified.value = null
      return
    }
    if (lastErrorNotified.value === error) {
      return
    }
    notify.push(error, 'error', 3600)
    lastErrorNotified.value = error
  },
)

const selectedTask = computed<DataProcessTaskResponse | null>(() => {
  if (!selectedTaskId.value) {
    return null
  }
  return filteredTasks.value.find((item) => item.task_id === selectedTaskId.value) ?? null
})

function canCancel(status: string): boolean {
  return status === 'QUEUED' || status === 'RUNNING' || status === 'CANCELING'
}

function canRetry(status: string): boolean {
  return status === 'FAILED' || status === 'CANCELED'
}

function canDelete(status: string): boolean {
  return canRetry(status) || status === 'COMPLETED'
}

function handleRefreshClick(): void {
  void taskStore.fetchTasks()
}

function toggleAutoRefresh(): void {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  if (autoRefreshEnabled.value) {
    void taskStore.fetchTasks()
    autoRefreshTimer = window.setInterval(() => {
      void taskStore.fetchTasks()
    }, 5000)
    notify.push(t('tasks.autoRefreshEnabled'), 'info', 2200)
    return
  }
  if (autoRefreshTimer !== null) {
    window.clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  notify.push(t('tasks.autoRefreshDisabled'), 'info', 2200)
}

async function deleteTaskWithConfirm(taskId: string): Promise<void> {
  const confirmed = await dialog.confirm({
    title: t('tasks.deleteTitle'),
    message: t('tasks.deleteConfirm', { taskId }),
    confirmText: t('actions.delete'),
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  try {
    await taskStore.deleteTask(taskId)
    if (selectedTaskId.value === taskId) {
      selectedTaskId.value = taskStore.tasks[0]?.task_id ?? null
    }
    notify.push(t('tasks.deleted', { taskId }), 'success')
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.deleteTask'), 'error', 3600)
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ t('tasks.title') }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ t('tasks.autoRefreshLastUpdated', {
            status: autoRefreshEnabled ? t('tasks.autoRefreshOn') : t('tasks.autoRefreshOff'),
            time: taskStore.lastUpdatedAt ? formatDateTime(taskStore.lastUpdatedAt) : '-',
          }) }}
        </p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('tasks.legend') }}
        </p>
      </div>
      <AppButton tone="sky" size="md" :title="t('tasks.autoRefreshHint')" @click="handleRefreshClick"
        @dblclick.prevent="toggleAutoRefresh">
        <RefreshCw class="h-4 w-4" :class="autoRefreshEnabled ? 'animate-spin' : ''" />
        <span>{{ t('actions.refresh') }}</span>
      </AppButton>
    </header>

    <TaskQueueCards :total="taskStore.total" :queued="taskStore.queued" :running="taskStore.running"
      :completed="taskStore.completed" :failed="taskStore.failed" :canceled="taskStore.canceled" />

    <SimpleSearchBar v-model="keyword" :placeholder="t('tasks.searchPlaceholder')" />

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
      <TaskListTable :tasks="filteredTasks" v-model:selected-task-id="selectedTaskId" :offset="taskStore.offset"
        :sort-order="taskStore.sortOrder" :sort-by="taskStore.sortBy" @sort="taskStore.toggleSort" />

      <TaskDetailPanel v-if="selectedTask" :task="selectedTask" :can-cancel="canCancel(selectedTask.status)"
        :can-retry="canRetry(selectedTask.status)" :can-delete="canDelete(selectedTask.status)"
        @cancel="taskStore.cancelTask" @retry="taskStore.retryTask" @delete="deleteTaskWithConfirm" />
    </div>

    <PagerBar :current-page="taskStore.currentPage" :total-pages="taskStore.totalPages" :total-count="taskStore.total"
      :rows-per-page="taskStore.limit" @prev-page="taskStore.prevPage()" @next-page="taskStore.nextPage()"
      @set-page="taskStore.setPage" @set-limit="taskStore.setLimit" />
  </section>
</template>
