<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileText, Folder, LayoutDashboard, MessageSquare } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import { useNotify } from '@/composables/useNotify'
import type {
  AgentTraceResponse,
  ConversationResponse,
  ConversationTurnResponse,
  PaperDetailResponse,
} from '@/types/api'

import OverviewTabPanel from './OverviewTabPanel.vue'
import PapersTabPanel from './PapersTabPanel.vue'
import ProjectFileBrowserTabPanel from './ProjectFileBrowserTabPanel.vue'
import TracesTabPanel from './TracesTabPanel.vue'

type TabKey = 'overview' | 'traces' | 'papers' | 'files'

const props = defineProps<{
  conversation: ConversationResponse
  turns: ConversationTurnResponse[]
  traces?: Record<string, AgentTraceResponse>
  selectedPaperId?: string | null
  selectedPaperNonce?: number
}>()

const emit = defineEmits<{
  scrollToTurn: [turnId: string]
}>()

const { t } = useI18n()
const notify = useNotify()
const activeTab = ref<TabKey>('overview')
const activePaperId = ref<string | null>(null)
const selectedPaper = ref<PaperDetailResponse | null>(null)
const paperLoading = ref(false)

const traceIds = computed(() => Array.from(new Set(props.turns.flatMap((turn) => turn.trace_ids))))

const tabs = computed(() => [
  { key: 'overview' as TabKey, label: t('projects.chatDrawer.tabOverview'), icon: LayoutDashboard },
  { key: 'papers' as TabKey, label: t('projects.chatDrawer.tabPapers'), icon: FileText },
  { key: 'files' as TabKey, label: t('projects.chatDrawer.tabFiles'), icon: Folder },
  { key: 'traces' as TabKey, label: t('projects.chatDrawer.tabTraces'), icon: MessageSquare },
])

async function openPaperReference(paperId: string): Promise<void> {
  activeTab.value = 'papers'
  activePaperId.value = paperId
  paperLoading.value = true
  try {
    selectedPaper.value = await api.getPaper(paperId)
  } catch (err) {
    notify.push(
      err instanceof Error ? err.message : t('projects.errors.requestFailed'),
      'error',
      3600,
    )
    selectedPaper.value = null
  } finally {
    paperLoading.value = false
  }
}

async function reloadSelectedPaper(): Promise<void> {
  if (!activePaperId.value) return
  selectedPaper.value = await api.getPaper(activePaperId.value)
}

async function handleLinkPaper(paperId: string): Promise<void> {
  try {
    await api.linkProjectPaper(props.conversation.project_id, paperId)
    notify.push(t('projects.chatDrawer.paperLinked', { paperId }), 'success')
    await reloadSelectedPaper()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

async function handleLinkPaperToProject([projectId, paperId]: [string, string]): Promise<void> {
  try {
    await api.linkProjectPaper(projectId, paperId)
    notify.push(
      t('projects.chatDrawer.paperLinkedToProject', { paperId, projectName: projectId }),
      'success',
    )
    await reloadSelectedPaper()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

async function handleUnlinkPaper(paperId: string): Promise<void> {
  try {
    await api.unlinkProjectPaper(props.conversation.project_id, paperId)
    notify.push(t('projects.chatDrawer.paperUnlinked', { paperId }), 'success')
    await reloadSelectedPaper()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

watch(
  () => [props.selectedPaperId, props.selectedPaperNonce] as const,
  ([paperId]) => {
    if (!paperId) return
    void openPaperReference(paperId)
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="animate-fade-in-up flex h-full min-h-0 min-w-0 flex-col space-y-3 overflow-x-hidden"
  >
    <nav class="workspace-panel flex shrink-0 items-center gap-1 p-1.5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="
          activeTab === tab.key
            ? 'bg-ppx-bg-elevated text-ppx-text shadow-sm'
            : 'text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text'
        "
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" class="h-4 w-4" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <OverviewTabPanel
        v-show="activeTab === 'overview'"
        :conversation="conversation"
        :turns="turns"
        :trace-ids="traceIds"
        @open-paper="openPaperReference"
        @scroll-to-turn="emit('scrollToTurn', $event)"
      />

      <PapersTabPanel
        v-show="activeTab === 'papers'"
        :project-id="conversation.project_id"
        :loading="paperLoading"
        :paper="selectedPaper"
        @link="handleLinkPaper"
        @link-to-project="handleLinkPaperToProject"
        @unlink="handleUnlinkPaper"
      />

      <ProjectFileBrowserTabPanel
        v-show="activeTab === 'files'"
        :project-id="conversation.project_id"
        @open-paper="openPaperReference"
      />

      <TracesTabPanel
        v-show="activeTab === 'traces'"
        :trace-ids="traceIds"
        :traces="traces ?? {}"
      />
    </div>
  </section>
</template>
