<script setup lang="ts">
import { toRef } from 'vue'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import TraceCard from './TraceCard.vue'
import { useNotify } from '@/composables/useNotify'
import { useTraceDetail } from '@/composables/useTracesController'

const props = defineProps<{
  traceId: string
}>()

const emit = defineEmits<{
  close: []
  'list-refresh': []
}>()

const { t } = useI18n()
const notify = useNotify()
const detail = useTraceDetail(toRef(props, 'traceId'))

async function handleDelete(traceId: string) {
  const ok = await detail.remove()
  if (!ok) {
    return
  }
  notify.push(t('traces.deleted', { traceId }), 'success')
  emit('list-refresh')
  emit('close')
}
</script>

<template>
  <div
    v-if="detail.loading"
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3"
  >
    <LoaderCircle class="text-ppx-accent h-10 w-10 animate-spin" />
    <span class="text-ppx-text-muted text-sm font-medium">{{ t('traces.loading') }}</span>
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
        <div class="workspace-heading-card">{{ t('traces.loadFailed') }}</div>
        <p class="workspace-body mt-1">{{ detail.error }}</p>
      </div>
      <AppButton size="sm" variant="outline" tone="rose" @click="detail.loadTrace">
        <RefreshCw class="h-4 w-4" />
        <span>{{ t('traces.refresh') }}</span>
      </AppButton>
    </div>
  </div>

  <TraceCard
    v-else-if="detail.trace"
    :trace="detail.trace"
    :default-open="true"
    @delete="handleDelete"
  />
</template>
