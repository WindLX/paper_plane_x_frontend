<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileText, Folder, LayoutDashboard, LoaderCircle, MessageSquare } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import CopyableText from '@/components/CopyableText.vue'
import JsonPanel from '@/components/JsonPanel.vue'
import PaperDetailPanel from '@/components/paper/PaperDetailPanel.vue'
import ProjectFileBrowser from '@/components/project/ProjectFileBrowser.vue'
import TraceCard from '@/components/trace/TraceCard.vue'
import { useNotify } from '@/composables/useNotify'
import { useTraceStore } from '@/stores/traces'
import { useUiStore } from '@/stores/ui'
import type {
  ConversationResponse,
  ConversationTurnResponse,
  PaperDetailResponse,
} from '@/types/api'
import { formatDateTime } from '@/utils/format'

type TabKey = 'overview' | 'traces' | 'papers' | 'files'

const props = defineProps<{
  conversation: ConversationResponse
  turns: ConversationTurnResponse[]
}>()

const { t } = useI18n()
const notify = useNotify()
const traceStore = useTraceStore()
const uiStore = useUiStore()
const activeTab = ref<TabKey>('overview')
const visibleTraceCount = ref(10)
const selectedPaperId = ref<string | null>(null)
const selectedPaper = ref<PaperDetailResponse | null>(null)
const paperLoading = ref(false)
const outlineOpen = ref(true)
const refsOpen = ref(true)

const tabs = computed(() => [
  { key: 'overview' as TabKey, label: t('drawer.tabOverview'), icon: LayoutDashboard },
  { key: 'papers' as TabKey, label: t('drawer.tabPapers'), icon: FileText },
  { key: 'files' as TabKey, label: t('drawer.tabFiles'), icon: Folder },
  { key: 'traces' as TabKey, label: t('drawer.tabTraces'), icon: MessageSquare },
])

const traceIds = computed(() => Array.from(new Set(props.turns.flatMap((turn) => turn.trace_ids))))

const visibleTraceIds = computed(() => traceIds.value.slice(0, visibleTraceCount.value))

const hasMoreTraces = computed(() => visibleTraceIds.value.length < traceIds.value.length)

const paperReferences = computed(() => {
  const refs = new Map<string, string>()
  for (const turn of props.turns) {
    for (const event of turn.assistant_events) {
      if (event.message_kind !== 'assistant_final' || !event.content) continue
      for (const line of event.content.split('\n')) {
        const trimmed = line.trim().replace(/^[-*]\s*/, '')
        if (!trimmed) continue
        const pipeIdx = trimmed.indexOf('|')
        const paperId = (pipeIdx === -1 ? trimmed : trimmed.slice(0, pipeIdx)).trim()
        const label = (pipeIdx === -1 ? trimmed : trimmed.slice(pipeIdx + 1)).trim()
        if (paperId.startsWith('pap-')) {
          refs.set(paperId, label || paperId)
        }
      }
    }
  }
  return Array.from(refs.entries()).map(([paperId, label]) => ({ paperId, label }))
})

const hasPaperReferences = computed(() => paperReferences.value.length > 0)

interface OutlineItem {
  turnId: string
  label: string
}

const turnOutline = computed(() => {
  const items: OutlineItem[] = []
  for (let i = 0; i < props.turns.length; i++) {
    const turn = props.turns[i]
    let label = ''
    if (turn.user_message?.content) {
      label = turn.user_message.content.slice(0, 40)
    } else {
      const final = turn.assistant_events.find((e) => e.message_kind === 'assistant_final')
      if (final?.content) {
        label = final.content.slice(0, 40)
      }
    }
    if (!label) label = `Turn ${i + 1}`
    if (label.length >= 40) label += '…'
    items.push({ turnId: turn.turn_id, label })
  }
  return items
})

const hasOutline = computed(() => turnOutline.value.length > 0)

function jumpToTurn(turnId: string): void {
  uiStore.setScrollToTurnId(turnId)
}

function loadMore(): void {
  visibleTraceCount.value += 10
}

async function openPaperReference(paperId: string): Promise<void> {
  activeTab.value = 'papers'
  selectedPaperId.value = paperId
  paperLoading.value = true
  try {
    selectedPaper.value = await api.getPaper(paperId)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
    selectedPaper.value = null
  } finally {
    paperLoading.value = false
  }
}

async function handleLinkPaper(paperId: string): Promise<void> {
  try {
    await api.linkProjectPaper(props.conversation.project_id, paperId)
    notify.push(t('drawer.paperLinked', { paperId }), 'success')
    if (selectedPaperId.value) {
      selectedPaper.value = await api.getPaper(selectedPaperId.value)
    }
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

async function handleLinkPaperToProject(projectId: string, paperId: string): Promise<void> {
  try {
    await api.linkProjectPaper(projectId, paperId)
    notify.push(t('drawer.paperLinkedToProject', { paperId, projectName: projectId }), 'success')
    if (selectedPaperId.value) {
      selectedPaper.value = await api.getPaper(selectedPaperId.value)
    }
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

async function handleUnlinkPaper(paperId: string): Promise<void> {
  try {
    await api.unlinkProjectPaper(props.conversation.project_id, paperId)
    notify.push(t('drawer.paperUnlinked', { paperId }), 'success')
    if (selectedPaperId.value) {
      selectedPaper.value = await api.getPaper(selectedPaperId.value)
    }
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

watch(
  visibleTraceIds,
  (ids) => {
    if (ids.length > 0) {
      void traceStore.fetchByIds(ids)
    }
  },
  { immediate: true },
)

watch(
  () => uiStore.conversationDrawerPaperTarget,
  (paperId) => {
    if (paperId) {
      void openPaperReference(paperId)
      uiStore.setConversationDrawerPaperTarget(null)
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="animate-fade-in-up space-y-3.5">
    <!-- Tab Bar -->
    <nav class="workspace-panel flex items-center gap-1 p-1.5">
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

    <!-- Overview Tab -->
    <template v-if="activeTab === 'overview'">
      <header class="workspace-panel space-y-3 p-3.5">
        <h3 class="workspace-section-title">{{ props.conversation.title }}</h3>
        <div class="flex items-center justify-between gap-3">
          <CopyableText :text="props.conversation.conversation_id" mono />
        </div>
        <div class="text-ppx-text-soft grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div class="min-w-0">
            <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
              t('drawer.tabConversation')
            }}</span>
            <div>{{ props.turns.length }}</div>
          </div>
          <div class="min-w-0">
            <span class="text-ppx-text-muted mb-0.5 block font-semibold">Trace IDs</span>
            <div>{{ traceIds.length }}</div>
          </div>
          <div class="min-w-0">
            <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
              t('common.createdAt')
            }}</span>
            <div>{{ formatDateTime(props.conversation.created_at) }}</div>
          </div>
          <div class="min-w-0">
            <span class="text-ppx-text-muted mb-0.5 block font-semibold">{{
              t('common.updatedAt')
            }}</span>
            <div>{{ formatDateTime(props.conversation.updated_at) }}</div>
          </div>
        </div>
      </header>

      <JsonPanel
        :title="t('drawer.conversationTitle')"
        :value="{
          conversation: props.conversation,
          turn_count: props.turns.length,
          trace_ids: traceIds,
        }"
        :default-open="false"
        max-height="22vh"
      />

      <!-- Turn Outline -->
      <div v-if="hasOutline" class="workspace-panel overflow-hidden">
        <button
          type="button"
          class="workspace-section-title flex w-full cursor-pointer items-center gap-2 p-3.5 text-sm"
          @click="outlineOpen = !outlineOpen"
        >
          <MessageSquare class="h-4 w-4" />
          <span>{{ t('drawer.turnOutline') }}</span>
          <span class="workspace-chip ml-auto text-xs">{{ turnOutline.length }}</span>
        </button>
        <Transition name="section-collapse">
          <div v-if="outlineOpen" class="max-h-48 space-y-1 overflow-y-auto px-3.5 pb-3.5">
            <button
              v-for="(item, idx) in turnOutline"
              :key="item.turnId"
              type="button"
              class="hover:bg-ppx-bg-subtle flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors"
              @click="jumpToTurn(item.turnId)"
            >
              <span class="text-ppx-text-muted shrink-0 font-mono">{{ idx + 1 }}</span>
              <span class="text-ppx-text-soft truncate">{{ item.label }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Paper References Section -->
      <div v-if="hasPaperReferences" class="workspace-panel overflow-hidden">
        <button
          type="button"
          class="workspace-section-title flex w-full cursor-pointer items-center gap-2 p-3.5 text-sm"
          @click="refsOpen = !refsOpen"
        >
          <FileText class="h-4 w-4" />
          <span>{{ t('chat.references') }}</span>
          <span class="workspace-chip ml-auto text-xs">{{ paperReferences.length }}</span>
        </button>
        <Transition name="section-collapse">
          <div v-if="refsOpen" class="flex flex-wrap gap-2 px-3.5 pb-3.5">
            <button
              v-for="pRef in paperReferences"
              :key="pRef.paperId"
              type="button"
              class="workspace-chip hover-lift cursor-pointer text-left"
              @click="openPaperReference(pRef.paperId)"
            >
              {{ pRef.paperId }} | {{ pRef.label }}
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <!-- Papers Tab -->
    <template v-if="activeTab === 'papers'">
      <div
        v-if="paperLoading"
        class="flex h-full min-h-64 flex-col items-center justify-center gap-3"
      >
        <LoaderCircle class="text-ppx-accent h-8 w-8 animate-spin" />
        <span class="text-ppx-text-muted text-sm font-medium">{{ t('common.loading') }}</span>
      </div>
      <PaperDetailPanel
        v-else
        :paper="selectedPaper"
        :project-id="props.conversation.project_id"
        @link="handleLinkPaper"
        @link-to-project="handleLinkPaperToProject"
        @unlink="handleUnlinkPaper"
      />
    </template>

    <!-- Files Tab -->
    <template v-if="activeTab === 'files'">
      <ProjectFileBrowser :project-id="props.conversation.project_id" />
    </template>

    <!-- Traces Tab -->
    <template v-if="activeTab === 'traces'">
      <div class="space-y-3">
        <header class="flex items-center justify-between gap-2">
          <h3 class="workspace-section-title">{{ t('taskDetail.agentTraces') }}</h3>
          <span class="workspace-chip">{{ visibleTraceIds.length }} / {{ traceIds.length }}</span>
        </header>

        <div
          v-if="traceStore.error"
          class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs"
        >
          {{ traceStore.error }}
        </div>

        <div class="animate-stagger space-y-3">
          <TraceCard
            v-for="(traceId, index) in visibleTraceIds"
            :key="traceId"
            :trace="traceStore.getById(traceId)!"
            :default-open="index === visibleTraceIds.length - 1"
          />
          <div
            v-for="traceId in visibleTraceIds.filter((id) => !traceStore.getById(id))"
            :key="`missing-${traceId}`"
            class="workspace-badge--warning rounded-ppx-interactive border p-3 text-xs"
          >
            <div class="font-semibold">{{ t('taskDetail.missingTrace') }}</div>
            <div class="mt-1 font-mono">{{ traceId }}</div>
          </div>
        </div>

        <div v-if="hasMoreTraces" class="flex justify-center">
          <button type="button" class="workspace-chip cursor-pointer" @click="loadMore">
            {{ t('actions.loadMore') }}
          </button>
        </div>

        <div v-if="traceIds.length === 0" class="workspace-subpanel workspace-body p-4 text-sm">
          {{ t('taskDetail.noTracePayload') }}
        </div>
      </div>
    </template>
  </section>
</template>
