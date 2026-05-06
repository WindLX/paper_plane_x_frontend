<script setup lang="ts">
import { toRef } from 'vue'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { useNotify } from '@/composables/useNotify'
import { useTaskDetail } from '@/composables/useTasksController'

import AppButton from '../AppButton.vue'
import TaskDetailPanel from './TaskDetailPanel.vue'
import TaskTraceSection from './TaskTraceSection.vue'

const props = defineProps<{
  taskId: string
}>()

const emit = defineEmits<{
  close: []
  'list-refresh': [] // 通知父级：列表需要刷新
}>()

const { t } = useI18n()
const notify = useNotify()
const taskIdRef = toRef(props, 'taskId')
const detail = useTaskDetail(taskIdRef)

async function handleCancel() {
  const ok = await detail.cancel()
  if (!ok) {
    return
  }
  notify.push(t('tasks.detail.canceled', { taskId: props.taskId }), 'success')
  emit('list-refresh')
}

async function handleRetry() {
  const ok = await detail.retry()
  if (!ok) {
    return
  }
  notify.push(t('tasks.detail.retryed', { taskId: props.taskId }), 'success')
  emit('list-refresh')
}

async function handleDelete() {
  const ok = await detail.remove()
  if (!ok) {
    return
  }
  notify.push(t('tasks.detail.deleted', { taskId: props.taskId }), 'success')
  emit('list-refresh')
  emit('close')
}
</script>

<template>
  <div v-if="detail.loading" class="flex min-h-64 flex-col items-center justify-center gap-3">
    <LoaderCircle class="text-ppx-accent h-10 w-10 animate-spin" />
    <span class="text-ppx-text-muted text-sm font-medium">{{ t('tasks.detail.loading') }}</span>
  </div>

  <div
    v-else-if="detail.error"
    class="animate-fade-in-up flex h-full min-h-64 flex-col items-center justify-center gap-4"
  >
    <div class="workspace-panel flex max-w-xs flex-col items-center gap-3 p-6 text-center">
      <div class="bg-ppx-danger-soft flex h-12 w-12 items-center justify-center rounded-full">
        <AlertCircle class="text-ppx-danger h-6 w-6" />
      </div>
      <div>
        <div class="workspace-heading-card">{{ t('tasks.detail.loadFailed') }}</div>
        <p class="workspace-body mt-1">{{ detail.error }}</p>
      </div>
      <AppButton size="sm" variant="outline" tone="rose" @click="detail.loadTask">
        <RefreshCw class="h-4 w-4" />
        <span>{{ t('tasks.detail.refresh') }}</span>
      </AppButton>
    </div>
  </div>

  <template v-else-if="detail.task">
    <TaskDetailPanel
      :task="detail.task"
      :can-cancel="detail.canCancel"
      :can-retry="detail.canRetry"
      :can-delete="detail.canDelete"
      @cancel="handleCancel"
      @retry="handleRetry"
      @delete="handleDelete"
    />
    <TaskTraceSection
      v-if="detail.traceSections.length > 0"
      class="mt-4"
      :sections="detail.traceSections"
      :trace-store-error="null"
    />
  </template>
</template>
