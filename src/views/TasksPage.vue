<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  ExternalLink,
  ListOrdered,
  RefreshCw,
  RotateCcw,
  Search,
  Timer,
  Trash2,
  XCircle,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppButton from '../components/AppButton.vue'
import CopyableText from '../components/CopyableText.vue'
import JsonPanel from '../components/JsonPanel.vue'
import { useDialog } from '../composables/dialog'
import { useNotify } from '../composables/notify'
import { nextTriSortOrder } from '../composables/triSort'
import TaskStatusBadge from '../components/TaskStatusBadge.vue'
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
const jumpPageInput = ref('')
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

const queueCards = computed(() => [
  { label: t('tasks.cards.total'), value: taskStore.total, color: 'text-indigo-700 dark:text-indigo-300', icon: ListOrdered },
  { label: t('tasks.cards.queued'), value: taskStore.queued, color: 'text-sky-700 dark:text-sky-300', icon: Clock3 },
  { label: t('tasks.cards.running'), value: taskStore.running, color: 'text-amber-700 dark:text-amber-300', icon: Timer },
  { label: t('tasks.cards.completed'), value: taskStore.completed, color: 'text-emerald-700 dark:text-emerald-300', icon: CircleCheckBig },
  { label: t('tasks.cards.failed'), value: taskStore.failed, color: 'text-rose-700 dark:text-rose-300', icon: XCircle },
  { label: t('tasks.cards.canceled'), value: taskStore.canceled, color: 'text-slate-700 dark:text-slate-300', icon: Ban },
])

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

async function jumpToPage(): Promise<void> {
  const parsed = Number.parseInt(jumpPageInput.value, 10)
  if (!Number.isFinite(parsed)) return
  await taskStore.setPage(parsed)
  jumpPageInput.value = ''
}

async function toggleCreatedSort(): Promise<void> {
  const next = nextTriSortOrder(taskStore.sortOrder)
  await taskStore.setSortOrder(next)
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

    <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div v-for="card in queueCards" :key="card.label"
        class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div class="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <component :is="card.icon" class="h-3.5 w-3.5" />
          <span>{{ card.label }}</span>
        </div>
        <div class="mt-2 text-2xl font-semibold" :class="card.color">{{ card.value }}</div>
      </div>
    </div>

    <div
      class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <Search class="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <input v-model="keyword" :placeholder="t('tasks.searchPlaceholder')"
        class="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-800">
            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <th class="px-3 py-2">#</th>
              <th class="px-3 py-2">{{ t('tasks.table.taskId') }}</th>
              <th class="px-3 py-2">{{ t('tasks.table.paperId') }}</th>
              <th class="px-3 py-2">{{ t('tasks.table.status') }}</th>
              <th class="px-3 py-2">
                <AppButton size="xs" @click="toggleCreatedSort">
                  <span>{{ t('tasks.table.created') }}</span>
                  <ArrowUpWideNarrow v-if="taskStore.sortOrder === 'asc'" class="h-3.5 w-3.5" />
                  <ArrowDownWideNarrow v-else-if="taskStore.sortOrder === 'desc'" class="h-3.5 w-3.5" />
                  <ArrowDownUp v-else class="h-3.5 w-3.5" />
                </AppButton>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="(task, index) in filteredTasks" :key="task.task_id"
              class="cursor-pointer align-top transition-colors hover:bg-sky-50/60 dark:hover:bg-slate-800/70"
              :class="task.task_id === selectedTaskId ? 'bg-sky-50 dark:bg-sky-900/20' : ''"
              @click="selectedTaskId = task.task_id">
              <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                {{ taskStore.offset + index + 1 }}
              </td>
              <td class="px-3 py-2 font-mono text-xs">
                {{ task.task_id }}
              </td>
              <td class="px-3 py-2">
                <CopyableText :text="task.paper_id" mono />
              </td>
              <td class="px-3 py-2">
                <TaskStatusBadge :status="task.status" />
              </td>
              <td class="px-3 py-2 text-xs">{{ formatDateTime(task.created_at) }}</td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {{ t('tasks.empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <aside
        class="self-start rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
        <template v-if="selectedTask">
          <header class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ t('tasks.detail.title') }}</h3>
            <RouterLink :to="`/tasks/${selectedTask.task_id}`"
              class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <ExternalLink class="h-3.5 w-3.5" />
              <span>{{ t('actions.open') }}</span>
            </RouterLink>
          </header>
          <div class="mb-3 flex flex-wrap gap-2">
            <AppButton tone="amber" size="xs" :disabled="!canCancel(selectedTask.status)"
              @click="taskStore.cancelTask(selectedTask.task_id)">
              <Ban class="h-3.5 w-3.5" />
              <span>{{ t('actions.cancel') }}</span>
            </AppButton>
            <AppButton tone="sky" size="xs" :disabled="!canRetry(selectedTask.status)"
              @click="taskStore.retryTask(selectedTask.task_id)">
              <RotateCcw class="h-3.5 w-3.5" />
              <span>{{ t('actions.retry') }}</span>
            </AppButton>
            <AppButton tone="rose" size="xs" :disabled="!canDelete(selectedTask.status)"
              @click="deleteTaskWithConfirm(selectedTask.task_id)">
              <Trash2 class="h-3.5 w-3.5" />
              <span>{{ t('actions.delete') }}</span>
            </AppButton>
          </div>
          <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.taskId') }}:</span> {{ selectedTask.task_id
              }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.paperId') }}:</span> {{
              selectedTask.paper_id }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.status') }}:</span> {{ t(`status.${selectedTask.status}`) }}
            </div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.retryOf') }}:</span> {{
              selectedTask.retry_of_task_id ?? '-' }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.created') }}:</span> {{
              formatDateTime(selectedTask.created_at) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.started') }}:</span> {{
              formatDateTime(selectedTask.started_at) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.finished') }}:</span> {{
              formatDateTime(selectedTask.finished_at) }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.error') }}:</span> {{ selectedTask.error ??
              '-' }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.extractionTraceCount') }}:</span> {{
              selectedTask.extraction_trace_ids.length }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.analysisTraceCount') }}:</span> {{
              selectedTask.analysis_trace_ids.length }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.extractionFactCheckTraceCount') }}:</span> {{
              selectedTask.extraction_fact_check_trace_ids.length }}</div>
            <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('tasks.detail.analysisFactCheckTraceCount') }}:</span> {{
              selectedTask.analysis_fact_check_trace_ids.length }}</div>
          </div>
          <div class="mt-3">
            <JsonPanel :title="t('tasks.detail.rawTaskJson')" :value="selectedTask" :pre-wrap="true" max-height="48vh" defaultOpen />
          </div>
        </template>
        <div v-else class="text-sm text-slate-500 dark:text-slate-400">
          {{ t('tasks.noTaskSelected') }}
        </div>
      </aside>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="text-slate-600 dark:text-slate-300">
        {{ t('common.pageSummary', { current: taskStore.currentPage, total: taskStore.totalPages, count: taskStore.total }) }}
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-slate-500 dark:text-slate-400">{{ t('common.rows') }}</label>
        <select
          class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
          :value="taskStore.limit" @change="taskStore.setLimit(Number(($event.target as HTMLSelectElement).value))">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <AppButton size="xs" :disabled="!taskStore.hasPrevPage" @click="taskStore.prevPage()">
          <ChevronLeft class="h-3.5 w-3.5" />
          <span>{{ t('actions.prev') }}</span>
        </AppButton>
        <AppButton size="xs" :disabled="!taskStore.hasNextPage" @click="taskStore.nextPage()">
          <span>{{ t('actions.next') }}</span>
          <ChevronRight class="h-3.5 w-3.5" />
        </AppButton>
        <div class="ml-1 inline-flex items-center gap-1.5">
          <input v-model="jumpPageInput" type="number" min="1" :max="taskStore.totalPages" :placeholder="t('common.page')"
            class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
            @keydown.enter.prevent="jumpToPage" />
          <AppButton size="xs" @click="jumpToPage">
            <span>{{ t('actions.go') }}</span>
          </AppButton>
        </div>
      </div>
    </div>
  </section>
</template>
