<script setup lang="ts">
import { Ban, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import TaskStatusBadge from './TaskStatusBadge.vue'
import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'
import JsonPanel from '../JsonPanel.vue'
import type { DataProcessTaskResponse } from '@/types/api'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  task: DataProcessTaskResponse
  canCancel: boolean
  canRetry: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  cancel: [taskId: string]
  retry: [taskId: string]
  delete: [taskId: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="animate-fade-in-up space-y-3">
    <header class="workspace-panel space-y-3 p-3.5">
      <div class="text-ppx-text-soft space-y-2 text-xs">
        <div class="flex flex-col items-start gap-2">
          <span class="text-ppx-text-muted shrink-0 font-semibold">{{
            t('tasks.detail.taskId')
          }}</span>
          <CopyableText :text="props.task.task_id" mono />
        </div>
        <div class="flex flex-col items-start gap-2">
          <span class="text-ppx-text-muted shrink-0 font-semibold">{{
            t('tasks.detail.paperId')
          }}</span>
          <CopyableText :text="props.task.paper_id" mono />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-ppx-text-muted shrink-0 font-semibold">{{
            t('tasks.detail.status')
          }}</span>
          <TaskStatusBadge :status="props.task.status" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-ppx-text-muted shrink-0 font-semibold">{{
            t('tasks.detail.retryOf')
          }}</span>
          <CopyableText
            v-if="props.task.retry_of_task_id"
            :text="props.task.retry_of_task_id"
            mono
            class="ml-1"
          />
          <span v-else class="text-ppx-text-muted">-</span>
        </div>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto">
        <AppButton
          variant="outline"
          size="xs"
          :disabled="!props.canCancel"
          @click="emit('cancel', props.task.task_id)"
        >
          <Ban class="h-3.5 w-3.5" />
          <span>{{ t('tasks.detail.cancel') }}</span>
        </AppButton>
        <AppButton
          variant="outline"
          size="xs"
          :disabled="!props.canRetry"
          @click="emit('retry', props.task.task_id)"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          <span>{{ t('tasks.detail.retry') }}</span>
        </AppButton>
        <AppButton
          variant="outline"
          tone="rose"
          size="xs"
          :disabled="!props.canDelete"
          @click="emit('delete', props.task.task_id)"
        >
          <Trash2 class="h-3.5 w-3.5" />
          <span>{{ t('tasks.detail.delete') }}</span>
        </AppButton>
      </div>
    </header>

    <div class="workspace-panel p-3.5">
      <div class="text-ppx-text-soft grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('tasks.detail.created')
          }}</span>
          <div class="wrap-break-word">{{ formatDateTime(props.task.created_at) }}</div>
        </div>
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('tasks.detail.started')
          }}</span>
          <div class="wrap-break-word">{{ formatDateTime(props.task.started_at) }}</div>
        </div>
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('tasks.detail.finished')
          }}</span>
          <div class="wrap-break-word">{{ formatDateTime(props.task.finished_at) }}</div>
        </div>
        <div class="min-w-0">
          <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
            t('tasks.detail.totalTraces')
          }}</span>
          <div>
            {{
              props.task.extraction_trace_ids.length +
              props.task.analysis_trace_ids.length +
              props.task.extraction_fact_check_trace_ids.length +
              props.task.analysis_fact_check_trace_ids.length
            }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="props.task.error"
      class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs"
    >
      <span class="wrap-break-word">{{ props.task.error }}</span>
    </div>

    <JsonPanel
      :title="t('tasks.detail.rawTaskJson')"
      :value="props.task"
      max-height="36vh"
      :default-open="false"
    />
  </div>
</template>
