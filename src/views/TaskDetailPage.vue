<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import JsonPanel from '../components/JsonPanel.vue'
import TaskDetailHeader from '../components/task/TaskDetailHeader.vue'
import TaskInfoGrid from '../components/task/TaskInfoGrid.vue'
import TaskRetrySection from '../components/task/TaskRetrySection.vue'
import TaskTraceSection from '../components/task/TaskTraceSection.vue'
import { api } from '../api/client'
import { useDialog } from '../composables/dialog'
import { useNotify } from '../composables/notify'
import { useTaskStore } from '../stores/tasks'
import { useTraceStore } from '../stores/traces'
import type { DataProcessTaskResponse } from '../types/api'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const traceStore = useTraceStore()
const dialog = useDialog()
const notify = useNotify()
const { t } = useI18n()
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
      title: t('taskDetail.traceSections.extraction'),
      ids: current.extraction_trace_ids,
      entries: buildEntries(current.extraction_trace_ids),
    },
    {
      key: 'extraction_fact_check',
      title: t('taskDetail.traceSections.extractionFactCheck'),
      ids: current.extraction_fact_check_trace_ids,
      entries: buildEntries(current.extraction_fact_check_trace_ids),
    },
    {
      key: 'analysis',
      title: t('taskDetail.traceSections.analysis'),
      ids: current.analysis_trace_ids,
      entries: buildEntries(current.analysis_trace_ids),
    },
    {
      key: 'analysis_fact_check',
      title: t('taskDetail.traceSections.analysisFactCheck'),
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
    title: t('tasks.deleteTitle'),
    message: t('tasks.deleteConfirm', { taskId: taskIdToDelete }),
    confirmText: t('actions.delete'),
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  try {
    await taskStore.deleteTask(taskIdToDelete)
    notify.push(t('tasks.deleted', { taskId: taskIdToDelete }), 'success')
    await router.push('/tasks')
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.deleteTask'), 'error', 3600)
  }
}

async function deleteTraceWithConfirm(traceId: string): Promise<void> {
  const confirmed = await dialog.confirm({
    title: t('taskDetail.traceDeleteTitle'),
    message: t('taskDetail.traceDeleteConfirm', { traceId }),
    confirmText: t('actions.delete'),
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  try {
    await traceStore.deleteById(traceId)
    notify.push(t('taskDetail.traceDeleted', { traceId }), 'success')
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.deleteTrace'), 'error', 3600)
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
      error instanceof Error ? error.message : t('errors.loadRetryChildren'),
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
    <TaskDetailHeader :task-id="taskId" :task="task" :can-cancel="task ? canCancel(task.status) : false"
      :can-retry="task ? canRetry(task.status) : false" :can-delete="task ? canDelete(task.status) : false"
      @cancel="taskStore.cancelTask" @retry="taskStore.retryTask" @delete="deleteTaskWithConfirm" />

    <div v-if="!task"
      class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
      {{ t('taskDetail.notFound') }}
    </div>

    <template v-else>
      <TaskInfoGrid :task="task" />

      <TaskRetrySection :task="task" :retry-source-task="retrySourceTask" :retry-children="retryChildren"
        :retry-children-loading="retryChildrenLoading" />

      <TaskTraceSection :sections="traceSections" :trace-store-error="traceStore.error"
        @delete-trace="deleteTraceWithConfirm" />

      <JsonPanel :title="t('tasks.detail.rawTaskJson')" :value="task" />
    </template>
  </section>
</template>
