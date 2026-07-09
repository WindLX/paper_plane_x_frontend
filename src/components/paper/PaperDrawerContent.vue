<script setup lang="ts">
import { toRef, watch } from 'vue'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import PaperDetailPanel from './PaperDetailPanel.vue'
import { useLibraryDetail } from '@/composables/useLibraryController'
import { useNotify } from '@/composables/useNotify'

const props = defineProps<{
  paperId: string | null
  reloadKey?: number
}>()

const emit = defineEmits<{
  linkToProject: [[projectId: string, paperId: string]]
  unlink: [projectId: string]
  refreshList: []
  close: []
}>()

const { t } = useI18n()
const notify = useNotify()
const paperIdRef = toRef(props, 'paperId')
const detail = useLibraryDetail(paperIdRef)

async function reloadPaper(): Promise<void> {
  await detail.loadPaper()
}

async function handleDelete(): Promise<void> {
  const paper = detail.paper
  if (!paper) return

  const ok = await detail.deletePaper()
  if (!ok) {
    return
  }

  notify.push(t('library.detail.paperDeleted', { paperId: paper.paper_id }), 'success')
  emit('refreshList')
  emit('close')
}

function handleAgentNoteUpdated(agentNote: string | null): void {
  if (!detail.paper) return
  detail.paper.agent_note = agentNote
}

watch(
  () => [props.paperId, props.reloadKey],
  () => {
    void reloadPaper()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-4">
    <div v-if="detail.loading" class="flex min-h-64 flex-col items-center justify-center gap-3">
      <LoaderCircle class="text-ppx-accent h-10 w-10 animate-spin" />
      <span class="text-ppx-text-muted text-sm font-medium">{{ t('library.detail.loading') }}</span>
    </div>

    <div
      v-else-if="detail.error"
      class="animate-fade-in-up flex min-h-64 flex-col items-center justify-center gap-4"
    >
      <div class="workspace-panel flex max-w-xs flex-col items-center gap-3 p-6 text-center">
        <div class="bg-ppx-danger-soft flex h-12 w-12 items-center justify-center rounded-full">
          <AlertCircle class="text-ppx-danger h-6 w-6" />
        </div>
        <div>
          <div class="workspace-heading-card">{{ t('library.detail.loadFailed') }}</div>
          <p class="workspace-body mt-1">{{ detail.error }}</p>
        </div>
        <AppButton size="sm" variant="outline" tone="rose" @click="detail.loadPaper">
          <RefreshCw class="h-4 w-4" />
          <span>{{ t('library.detail.refresh') }}</span>
        </AppButton>
      </div>
    </div>

    <div v-else-if="detail.paper">
      <PaperDetailPanel
        :paper="detail.paper"
        @link-to-project="emit('linkToProject', $event)"
        @unlink="emit('unlink', $event)"
        @delete="handleDelete"
        @agent-note-updated="handleAgentNoteUpdated"
      />
    </div>
  </div>
</template>
