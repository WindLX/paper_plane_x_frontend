<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import PapersTabPanel from '@/components/project/PapersTabPanel.vue'
import { useNotify } from '@/composables/useNotify'
import type { PaperDetailResponse } from '@/types/api'

const props = defineProps<{
  projectId: string
  initialPaperId?: string | null
  pdfOpen?: boolean
}>()

const emit = defineEmits<{ togglePdf: [paper: PaperDetailResponse] }>()

const { t } = useI18n()
const notify = useNotify()

const activePaperId = ref<string | null>(null)
const selectedPaper = ref<PaperDetailResponse | null>(null)
const paperLoading = ref(false)

async function loadPaper(paperId: string): Promise<void> {
  paperLoading.value = true
  selectedPaper.value = null
  try {
    const paper = await api.getPaper(paperId)
    if (activePaperId.value !== paperId) return
    selectedPaper.value = paper
  } catch (err) {
    if (activePaperId.value !== paperId) return
    notify.push(
      err instanceof Error ? err.message : t('projects.errors.requestFailed'),
      'error',
      3600,
    )
    selectedPaper.value = null
  } finally {
    if (activePaperId.value === paperId) paperLoading.value = false
  }
}

watch(
  () => props.initialPaperId,
  (paperId) => {
    activePaperId.value = paperId ?? null
    selectedPaper.value = null
    if (paperId) {
      void loadPaper(paperId)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  activePaperId.value = null
})

function handleLink(): void {
  notify.push(t('projects.projectDrawer.paperLinkNotSupported'), 'info', 2000)
}

function handleLinkToProject(): void {
  notify.push(t('projects.projectDrawer.paperLinkNotSupported'), 'info', 2000)
}

function handleUnlink(_projectId: string): void {
  notify.push(t('projects.projectDrawer.paperLinkNotSupported'), 'info', 2000)
}

function handleAgentNoteUpdated(agentNote: string | null): void {
  if (!selectedPaper.value) return
  selectedPaper.value.agent_note = agentNote
}
</script>

<template>
  <section class="animate-fade-in-up flex h-full min-h-0 flex-col overflow-hidden">
    <nav class="workspace-panel flex shrink-0 items-center gap-1 p-1.5">
      <button
        type="button"
        class="bg-ppx-bg-elevated text-ppx-text flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors"
      >
        <FileText class="h-4 w-4" />
        <span>{{ t('projects.projectDrawer.tabPapers') }}</span>
      </button>
    </nav>

    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <PapersTabPanel
        :loading="paperLoading"
        :paper="selectedPaper"
        :pdf-open="pdfOpen"
        @toggle-pdf="emit('togglePdf', $event)"
        @link="handleLink"
        @link-to-project="handleLinkToProject"
        @unlink="handleUnlink"
        @agent-note-updated="handleAgentNoteUpdated"
      />
    </div>
  </section>
</template>
