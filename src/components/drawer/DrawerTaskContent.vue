<script setup lang="ts">
import TaskDetailPanel from '@/components/task/TaskDetailPanel.vue'
import TaskTraceSection from '@/components/task/TaskTraceSection.vue'
import type { AgentTraceResponse, DataProcessTaskResponse } from '@/types/api'

const props = defineProps<{
  task: DataProcessTaskResponse
  traceSections: Array<{
    key: string
    title: string
    ids: string[]
    entries: Array<{ traceId: string; trace: AgentTraceResponse | null }>
  }>
  traceStoreError: string | null
  canCancel: boolean
  canRetry: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  cancel: [taskId: string]
  retry: [taskId: string]
  delete: [taskId: string]
}>()
</script>

<template>
  <TaskDetailPanel
    :task="props.task"
    :can-cancel="props.canCancel"
    :can-retry="props.canRetry"
    :can-delete="props.canDelete"
    @cancel="emit('cancel', $event)"
    @retry="emit('retry', $event)"
    @delete="emit('delete', $event)"
  />

  <TaskTraceSection
    v-if="props.traceSections.length > 0"
    class="mt-4"
    :sections="props.traceSections"
    :trace-store-error="props.traceStoreError"
  />
</template>
