<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import PaperDetailPanel from '@/components/paper/PaperDetailPanel.vue'
import type { PaperDetailResponse } from '@/types/api'

defineProps<{
  loading: boolean
  paper: PaperDetailResponse | null
}>()

const emit = defineEmits<{
  link: [paperId: string]
  linkToProject: [[projectId: string, paperId: string]]
  unlink: [projectId: string]
  agentNoteUpdated: [agentNote: string | null]
}>()

const { t } = useI18n()

function onLinkToProject([projectId, paperId]: [string, string]) {
  emit('linkToProject', [projectId, paperId])
}
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto">
    <div v-if="loading" class="flex h-full min-h-64 flex-col items-center justify-center gap-3">
      <LoaderCircle class="text-ppx-accent h-8 w-8 animate-spin" />
      <span class="text-ppx-text-muted text-sm font-medium">{{
        t('projects.common.loading')
      }}</span>
    </div>
    <PaperDetailPanel
      v-else
      :paper="paper"
      @link="emit('link', $event)"
      @link-to-project="onLinkToProject"
      @unlink="emit('unlink', $event)"
      @agent-note-updated="emit('agentNoteUpdated', $event)"
    />
  </div>
</template>
