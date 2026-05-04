<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import PagerBar from '../components/PagerBar.vue'
import SimpleSearchBar from '../components/SimpleSearchBar.vue'
import TaskListTable from '../components/task/TaskListTable.vue'
import TaskQueueCards from '../components/task/TaskQueueCards.vue'
import TaskToolbar from '../components/task/TaskToolbar.vue'
import { useAutoRefresh } from '../composables/useAutoRefresh'
import { useNotify } from '../composables/useNotify'
import { useTaskStore } from '../stores/tasks'
import { useUiStore } from '../stores/ui'

const taskStore = useTaskStore()
const notify = useNotify()
const uiStore = useUiStore()
const { t } = useI18n()
const lastErrorNotified = ref<string | null>(null)
const selectedTaskId = ref<string | null>(null)
const keyword = ref('')

const autoRefresh = useAutoRefresh(() => {
  void taskStore.fetchTasks()
})

const filteredTasks = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return taskStore.tasks
  }
  return taskStore.tasks.filter((task) => {
    const haystacks = [task.task_id, task.paper_id, task.status, task.retry_of_task_id ?? '']
    return haystacks.some((item) => item.toLowerCase().includes(search))
  })
})

onMounted(async () => {
  await taskStore.fetchTasks({ offset: 0, limit: 20 })
})

watch(
  () => filteredTasks.value,
  (items, oldItems) => {
    if (items.length === 0) {
      selectedTaskId.value = null
      return
    }
    // 只在列表过滤变化时调整（oldItems 非空），避免首次加载后自动选中第一项
    if (!oldItems || oldItems.length === 0) return
    if (!selectedTaskId.value) return
    const exists = items.some((task) => task.task_id === selectedTaskId.value)
    if (!exists) {
      selectedTaskId.value = items[0].task_id
    }
  },
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

watch(
  () => uiStore.rightDrawerOpen,
  (isOpen) => {
    if (!isOpen) {
      selectedTaskId.value = null
    }
  },
)

function handleToggleAutoRefresh(): void {
  autoRefresh.toggleAutoRefresh()
  if (autoRefresh.autoRefreshEnabled.value) {
    notify.push(t('tasks.autoRefreshEnabled'), 'info', 1800)
  } else {
    notify.push(t('tasks.autoRefreshDisabled'), 'info', 1800)
  }
}

async function cancelTaskFromTable(taskId: string): Promise<void> {
  try {
    await taskStore.cancelTask(taskId)
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.fetchTasks'), 'error', 2200)
  }
}

async function retryTaskFromTable(taskId: string): Promise<void> {
  try {
    await taskStore.retryTask(taskId)
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.fetchTasks'), 'error', 2200)
  }
}

async function deleteTaskFromTable(taskId: string): Promise<void> {
  try {
    await taskStore.deleteTask(taskId)
    notify.push(t('tasks.deleted', { taskId }), 'success', 1800)
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.deleteTask'), 'error', 2200)
  }
}

function openTaskDrawer(taskId: string): void {
  uiStore.openRightDrawer('task', { taskId }, 'local')
}

function closeTaskDrawer(): void {
  uiStore.closeRightDrawer()
}
</script>

<template>
  <section class="space-y-4">
    <TaskToolbar
      :auto-refresh-enabled="autoRefresh.autoRefreshEnabled.value"
      :refreshing="autoRefresh.refreshing.value"
      :last-updated-at="taskStore.lastUpdatedAt"
      @toggle-auto-refresh="handleToggleAutoRefresh"
    />

    <TaskQueueCards
      :total="taskStore.total"
      :queued="taskStore.queued"
      :running="taskStore.running"
      :completed="taskStore.completed"
      :failed="taskStore.failed"
      :canceled="taskStore.canceled"
    />

    <section class="workspace-panel p-3">
      <SimpleSearchBar v-model="keyword" :placeholder="t('tasks.searchPlaceholder')" />
    </section>

    <div :key="`${keyword}-${taskStore.currentPage}`" class="animate-fade-in-up space-y-4">
      <TaskListTable
        v-model:selected-task-id="selectedTaskId"
        :tasks="filteredTasks"
        :offset="taskStore.offset"
        :sort-order="taskStore.sortOrder"
        :sort-by="taskStore.sortBy"
        @sort="taskStore.toggleSort"
        @cancel="cancelTaskFromTable"
        @retry="retryTaskFromTable"
        @delete="deleteTaskFromTable"
        @open="openTaskDrawer"
        @close="closeTaskDrawer"
      />

      <PagerBar
        :current-page="taskStore.currentPage"
        :total-pages="taskStore.totalPages"
        :total-count="taskStore.total"
        :rows-per-page="taskStore.limit"
        @prev-page="taskStore.prevPage()"
        @next-page="taskStore.nextPage()"
        @set-page="taskStore.setPage"
        @set-limit="taskStore.setLimit"
      />
    </div>
  </section>
</template>
