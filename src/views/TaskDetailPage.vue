<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertTriangle, ArrowLeft, Ban, RotateCcw, Trash2 } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppButton from '../components/AppButton.vue'
import CopyableText from '../components/CopyableText.vue'
import JsonPanel from '../components/JsonPanel.vue'
import TaskStatusBadge from '../components/TaskStatusBadge.vue'
import TraceCard from '../components/TraceCard.vue'
import { api } from '../api/client'
import { useDialog } from '../composables/dialog'
import { useNotify } from '../composables/notify'
import { useTaskStore } from '../stores/tasks'
import { useTraceStore } from '../stores/traces'
import type { DataProcessTaskResponse } from '../types/api'
import { formatDateTime } from '../utils/format'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const traceStore = useTraceStore()
const dialog = useDialog()
const notify = useNotify()
const fallbackTask = ref<DataProcessTaskResponse | null>(null)
const retrySourceFallback = ref<DataProcessTaskResponse | null>(null)
const retryChildren = ref<DataProcessTaskResponse[]>([])
const retryChildrenLoading = ref(false)

const taskId = computed(() => String(route.params.taskId ?? ''))
const task = computed(() => taskStore.getTask(taskId.value) ?? fallbackTask.value ?? undefined)

const retrySourceTask = computed(() => {
  const current = task.value
  if (!current?.retry_of_task_id) {
    return undefined
  }
  return (
    taskStore.getTask(current.retry_of_task_id) ??
    (retrySourceFallback.value?.task_id === current.retry_of_task_id
      ? retrySourceFallback.value
      : undefined)
  )
})

const allTraceIds = computed(() => {
  const current = task.value
  if (!current) {
    return []
  }
  return [
    ...current.extraction_trace_ids,
    ...current.analysis_trace_ids,
    ...current.extraction_fact_check_trace_ids,
    ...current.analysis_fact_check_trace_ids,
  ]
})

const traceSections = computed(() => {
  const current = task.value
  if (!current) {
    return []
  }
  const buildEntries = (ids: string[]) =>
    ids.map((traceId) => ({
      traceId,
      trace: traceStore.getById(traceId) ?? null,
    }))
  return [
    {
      key: 'extraction',
      title: 'Extraction Loop',
      ids: current.extraction_trace_ids,
      entries: buildEntries(current.extraction_trace_ids),
    },
    {
      key: 'extraction_fact_check',
      title: 'Extraction Fact Check Loop',
      ids: current.extraction_fact_check_trace_ids,
      entries: buildEntries(current.extraction_fact_check_trace_ids),
    },
    {
      key: 'analysis',
      title: 'Analysis Loop',
      ids: current.analysis_trace_ids,
      entries: buildEntries(current.analysis_trace_ids),
    },
    {
      key: 'analysis_fact_check',
      title: 'Analysis Fact Check Loop',
      ids: current.analysis_fact_check_trace_ids,
      entries: buildEntries(current.analysis_fact_check_trace_ids),
    },
  ]
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

async function deleteTaskWithConfirm(taskIdToDelete: string): Promise<void> {
  const confirmed = await dialog.confirm({
    title: 'Delete Task Record',
    message: `Delete task record ${taskIdToDelete}? This only removes this task row.`,
    confirmText: 'Delete',
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  try {
    await taskStore.deleteTask(taskIdToDelete)
    notify.push(`Task ${taskIdToDelete} deleted`, 'success')
    await router.push('/tasks')
  } catch (error) {
    notify.push(error instanceof Error ? error.message : 'Failed to delete task', 'error', 3600)
  }
}

async function deleteTraceWithConfirm(traceId: string): Promise<void> {
  const confirmed = await dialog.confirm({
    title: 'Delete Trace',
    message: `Delete trace ${traceId}? Task trace ids will keep this id and show as missing.`,
    confirmText: 'Delete',
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  try {
    await traceStore.deleteById(traceId)
    notify.push(`Trace ${traceId} deleted`, 'success')
  } catch (error) {
    notify.push(error instanceof Error ? error.message : 'Failed to delete trace', 'error', 3600)
  }
}

async function redirectToNotFound(): Promise<void> {
  await router.replace({
    name: 'NotFoundPage',
    params: { pathMatch: ['tasks', taskId.value] },
  })
}

async function ensureData(): Promise<void> {
  await taskStore.fetchTasks({ offset: 0, limit: 200 })
  if (!taskStore.getTask(taskId.value)) {
    fallbackTask.value = await taskStore.fetchTaskById(taskId.value)
  } else {
    fallbackTask.value = null
  }

  if (!taskStore.getTask(taskId.value) && !fallbackTask.value) {
    await redirectToNotFound()
    return
  }

  await loadRetryRelations()
  if (allTraceIds.value.length > 0) {
    await traceStore.fetchByIds(allTraceIds.value)
  }
}

async function loadRetryRelations(): Promise<void> {
  const current = task.value
  retryChildren.value = []
  retrySourceFallback.value = null

  if (!current) {
    return
  }

  if (current.retry_of_task_id) {
    retrySourceFallback.value = await taskStore.fetchTaskById(current.retry_of_task_id)
  }

  retryChildrenLoading.value = true
  try {
    const pageLimit = 200
    let offset = 0
    let total = 0
    const children: DataProcessTaskResponse[] = []
    const seen = new Set<string>()

    do {
      const page = await api.listTasks(offset, pageLimit)
      total = page.total
      for (const item of page.items) {
        if (item.retry_of_task_id === current.task_id && !seen.has(item.task_id)) {
          seen.add(item.task_id)
          children.push(item)
        }
      }
      offset += page.limit
    } while (offset < total)

    retryChildren.value = children
  } catch (error) {
    retryChildren.value = []
    notify.push(
      error instanceof Error ? error.message : 'Failed to load retry children',
      'warning',
      2600,
    )
  } finally {
    retryChildrenLoading.value = false
  }
}

onMounted(() => {
  void ensureData()
})

watch(allTraceIds, (ids) => {
  if (ids.length > 0) {
    void traceStore.fetchByIds(ids)
  }
})

watch(taskId, () => {
  void ensureData()
})
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-semibold">Task Detail</h2>
          <TaskStatusBadge v-if="task" :status="task.status" />
        </div>
        <p class="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{{ taskId }}</p>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink to="/tasks"
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
          <ArrowLeft class="h-4 w-4" />
          <span>Back</span>
        </RouterLink>
        <AppButton v-if="task" tone="amber" size="md" :disabled="!canCancel(task.status)"
          @click="taskStore.cancelTask(task.task_id)">
          <Ban class="h-4 w-4" />
          <span>Cancel</span>
        </AppButton>
        <AppButton v-if="task" tone="sky" size="md" :disabled="!canRetry(task.status)"
          @click="taskStore.retryTask(task.task_id)">
          <RotateCcw class="h-4 w-4" />
          <span>Retry</span>
        </AppButton>
        <AppButton v-if="task" tone="rose" size="md" :disabled="!canDelete(task.status)"
          @click="deleteTaskWithConfirm(task.task_id)">
          <Trash2 class="h-4 w-4" />
          <span>Delete</span>
        </AppButton>
      </div>
    </header>

    <div v-if="!task"
      class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
      Task not found in current list.
    </div>

    <template v-else>
      <section
        class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2 lg:grid-cols-3">
        <div><span class="text-xs text-slate-500">Task ID</span>
          <div class="font-mono text-xs">{{ task.task_id }}</div>
        </div>
        <div><span class="text-xs text-slate-500">Paper ID</span>
          <div class="text-xs">
            <CopyableText :text="task.paper_id" mono />
          </div>
        </div>
        <div><span class="text-xs text-slate-500">Status</span>
          <div>
            <TaskStatusBadge :status="task.status" />
          </div>
        </div>
        <div><span class="text-xs text-slate-500">Created</span>
          <div class="text-sm">{{ formatDateTime(task.created_at) }}</div>
        </div>
        <div><span class="text-xs text-slate-500">Started</span>
          <div class="text-sm">{{ formatDateTime(task.started_at) }}</div>
        </div>
        <div><span class="text-xs text-slate-500">Finished</span>
          <div class="text-sm">{{ formatDateTime(task.finished_at) }}</div>
        </div>
        <div class="md:col-span-2 lg:col-span-3">
          <span class="text-xs text-slate-500">Error</span>
          <div class="text-sm text-rose-700 dark:text-rose-300">{{ task.error ?? '-' }}</div>
        </div>
      </section>

      <section class="grid gap-3 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">Retry Source</h3>
          <div v-if="task.retry_of_task_id" class="mt-2">
            <RouterLink :to="`/tasks/${task.retry_of_task_id}`"
              class="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800">
              <span class="font-mono text-sky-700 hover:underline dark:text-sky-300">{{ task.retry_of_task_id }}</span>
              <TaskStatusBadge v-if="retrySourceTask" :status="retrySourceTask.status" />
            </RouterLink>
          </div>
          <div v-else class="mt-2 text-sm text-slate-500 dark:text-slate-400">None</div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">Retry Children</h3>
          <div v-if="retryChildrenLoading" class="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
          <div v-else-if="retryChildren.length === 0" class="mt-2 text-sm text-slate-500 dark:text-slate-400">None</div>
          <div v-else class="mt-2 space-y-1">
            <RouterLink v-for="child in retryChildren" :key="child.task_id" :to="`/tasks/${child.task_id}`"
              class="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800">
              <span class="font-mono text-sky-700 hover:underline dark:text-sky-300">{{ child.task_id }}</span>
              <TaskStatusBadge :status="child.status" />
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <header class="space-y-1">
          <h3 class="text-base font-semibold">Agent Traces</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Showing all task-level trace ids grouped by processing loop.
          </p>
        </header>

        <div v-if="traceStore.error"
          class="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
          {{ traceStore.error }}
        </div>

        <details v-for="(section, sectionIndex) in traceSections" :key="section.key" :open="sectionIndex === 0"
          class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <summary class="cursor-pointer list-none">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ section.title }}</h4>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                traces {{ section.entries.filter((item) => item.trace !== null).length }}/{{ section.ids.length }}
              </span>
            </div>
          </summary>
          <div class="mt-3 space-y-3">
            <div v-if="section.ids.length === 0"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              []
            </div>
            <template v-else>
              <JsonPanel :title="`${section.title} Trace IDs`" :value="section.ids" pre-wrap />
              <div v-if="section.entries.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
                No trace payload loaded yet.
              </div>
              <template v-for="(entry, traceIndex) in section.entries" :key="entry.traceId">
                <TraceCard v-if="entry.trace" :trace="entry.trace" :default-open="traceIndex === 0"
                  @delete="deleteTraceWithConfirm" />
                <div v-else
                  class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  <div class="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
                    <AlertTriangle class="h-3.5 w-3.5" />
                    <span>Missing Trace</span>
                  </div>
                  <div class="font-mono text-xs">{{ entry.traceId }}</div>
                  <p class="mt-1 text-xs opacity-90">
                    This trace id exists on the task, but no corresponding record was found.
                  </p>
                </div>
              </template>
            </template>
          </div>
        </details>
      </section>

      <JsonPanel title="Raw Task JSON" :value="task" pre-wrap />
    </template>
  </section>
</template>
