<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertCircle, LoaderCircle, PanelRightClose, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppButton from '@/components/AppButton.vue'
import { useDialog } from '@/composables/useDialog'
import { useNotify } from '@/composables/useNotify'
import { useTaskStore } from '@/stores/tasks'
import { useTraceStore } from '@/stores/traces'
import { useUiStore } from '@/stores/ui'
import type {
  AgentTraceResponse,
  ConversationResponse,
  ConversationTurnResponse,
  DataProcessTaskResponse,
  PaperDetailResponse,
} from '@/types/api'
import DrawerConversationContent from './DrawerConversationContent.vue'
import DrawerPaperContent from './DrawerPaperContent.vue'
import DrawerTaskContent from './DrawerTaskContent.vue'
import DrawerTraceContent from './DrawerTraceContent.vue'

const { t } = useI18n()
const dialog = useDialog()
const notify = useNotify()
const uiStore = useUiStore()
const taskStore = useTaskStore()
const traceStore = useTraceStore()

const paper = ref<PaperDetailResponse | null>(null)
const task = ref<DataProcessTaskResponse | null>(null)
const trace = ref<AgentTraceResponse | null>(null)
const conversation = ref<ConversationResponse | null>(null)
const conversationTurns = ref<ConversationTurnResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const currentTitle = computed(() => {
  if (uiStore.rightDrawerType === 'paper') {
    return t('drawer.paperTitle')
  }
  if (uiStore.rightDrawerType === 'task') {
    return t('drawer.taskTitle')
  }
  if (uiStore.rightDrawerType === 'trace') {
    return t('drawer.traceTitle')
  }
  if (uiStore.rightDrawerType === 'conversation') {
    return t('drawer.conversationTitle')
  }
  if (uiStore.rightDrawerPayload?.title) {
    return uiStore.rightDrawerPayload.title
  }
  return t('drawer.defaultTitle')
})

const allTraceIds = computed(() => {
  if (!task.value) return []
  return [
    ...task.value.extraction_trace_ids,
    ...task.value.analysis_trace_ids,
    ...task.value.extraction_fact_check_trace_ids,
    ...task.value.analysis_fact_check_trace_ids,
  ]
})

const traceSections = computed(() => {
  if (!task.value) return []
  const buildEntries = (ids: string[]) =>
    ids.map((traceId) => ({
      traceId,
      trace: traceStore.getById(traceId) ?? null,
    }))
  return [
    {
      key: 'extraction',
      title: t('taskDetail.traceSections.extraction'),
      ids: task.value.extraction_trace_ids,
      entries: buildEntries(task.value.extraction_trace_ids),
    },
    {
      key: 'extraction_fact_check',
      title: t('taskDetail.traceSections.extractionFactCheck'),
      ids: task.value.extraction_fact_check_trace_ids,
      entries: buildEntries(task.value.extraction_fact_check_trace_ids),
    },
    {
      key: 'analysis',
      title: t('taskDetail.traceSections.analysis'),
      ids: task.value.analysis_trace_ids,
      entries: buildEntries(task.value.analysis_trace_ids),
    },
    {
      key: 'analysis_fact_check',
      title: t('taskDetail.traceSections.analysisFactCheck'),
      ids: task.value.analysis_fact_check_trace_ids,
      entries: buildEntries(task.value.analysis_fact_check_trace_ids),
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

async function hydrateDrawer(): Promise<void> {
  if (!uiStore.rightDrawerOpen || !uiStore.rightDrawerType) {
    paper.value = null
    task.value = null
    trace.value = null
    conversation.value = null
    conversationTurns.value = []
    error.value = null
    return
  }

  loading.value = true
  error.value = null
  paper.value = null
  task.value = null
  trace.value = null
  conversation.value = null
  conversationTurns.value = []

  try {
    if (uiStore.rightDrawerType === 'paper' && uiStore.rightDrawerPayload?.paperId) {
      paper.value = await api.getPaper(uiStore.rightDrawerPayload.paperId)
    }

    if (uiStore.rightDrawerType === 'task' && uiStore.rightDrawerPayload?.taskId) {
      task.value =
        taskStore.getTask(uiStore.rightDrawerPayload.taskId) ??
        (await taskStore.fetchTaskById(uiStore.rightDrawerPayload.taskId))
    }

    if (uiStore.rightDrawerType === 'trace' && uiStore.rightDrawerPayload?.traceId) {
      trace.value =
        traceStore.getById(uiStore.rightDrawerPayload.traceId) ??
        (await api.queryAgentTraces([uiStore.rightDrawerPayload.traceId])).items[0] ??
        null
      if (trace.value) {
        traceStore.traces[trace.value.trace_id] = trace.value
      }
    }

    if (uiStore.rightDrawerType === 'conversation' && uiStore.rightDrawerPayload?.conversationId) {
      const [convRes, turnRes] = await Promise.all([
        api.getConversation(uiStore.rightDrawerPayload.conversationId),
        api.listTurns(uiStore.rightDrawerPayload.conversationId),
      ])
      conversation.value = convRes
      conversationTurns.value = turnRes
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

function handleClose(): void {
  uiStore.closeRightDrawer()
}

async function deleteTask(taskId: string): Promise<void> {
  try {
    await taskStore.deleteTask(taskId)
    notify.push(t('tasks.deleted', { taskId }), 'success')
    await handleClose()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.deleteTask'), 'error', 3600)
  }
}

async function deleteTraceWithConfirm(traceId: string): Promise<void> {
  const confirmed = await dialog.confirm({
    title: t('taskDetail.traceDeleteTitle'),
    message: t('taskDetail.traceDeleteConfirm', { traceId }),
    confirmText: t('actions.delete'),
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    await traceStore.deleteById(traceId)
    notify.push(t('taskDetail.traceDeleted', { traceId }), 'success')
    await handleClose()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.deleteTrace'), 'error', 3600)
  }
}

async function linkPaper(paperId: string): Promise<void> {
  const projectId = uiStore.rightDrawerPayload?.projectId
  if (!projectId) return
  try {
    await api.linkProjectPaper(projectId, paperId)
    notify.push(t('drawer.paperLinked', { paperId }), 'success')
    await hydrateDrawer()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

async function linkPaperToProject(projectId: string, paperId: string): Promise<void> {
  try {
    await api.linkProjectPaper(projectId, paperId)
    notify.push(t('drawer.paperLinkedToProject', { paperId, projectName: projectId }), 'success')
    await hydrateDrawer()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

async function unlinkPaper(paperId: string): Promise<void> {
  const projectId = uiStore.rightDrawerPayload?.projectId
  if (!projectId) return
  try {
    await api.unlinkProjectPaper(projectId, paperId)
    notify.push(t('drawer.paperUnlinked', { paperId }), 'success')
    await hydrateDrawer()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : String(err), 'error', 3600)
  }
}

watch(
  () => [
    uiStore.rightDrawerOpen,
    uiStore.rightDrawerType,
    uiStore.rightDrawerPayload?.paperId,
    uiStore.rightDrawerPayload?.taskId,
    uiStore.rightDrawerPayload?.traceId,
    uiStore.rightDrawerPayload?.conversationId,
  ],
  () => {
    void hydrateDrawer()
  },
  { immediate: true },
)

watch(
  () => allTraceIds.value,
  (ids) => {
    if (ids.length > 0) {
      void traceStore.fetchByIds(ids)
    }
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-panel" appear>
      <aside
        v-if="uiStore.rightDrawerOpen"
        class="border-ppx-border bg-ppx-bg-elevated shadow-ppx-raised fixed top-0 right-0 z-50 flex h-screen w-full max-w-[min(100vw,44rem)] flex-col border-l xl:w-xl xl:max-w-none"
      >
        <header class="workspace-divider flex items-start justify-between gap-3 border-b px-4 py-4">
          <div class="min-w-0">
            <div class="text-ppx-text mt-1 text-lg font-semibold tracking-tight">
              {{ currentTitle }}
            </div>
            <div id="app-right-drawer-header-meta" class="mt-1" />
          </div>
          <div class="flex items-center gap-2">
            <div id="app-right-drawer-header-actions" class="flex items-center gap-2" />
            <button
              type="button"
              aria-label="Close drawer"
              class="workspace-icon-button"
              @click="handleClose"
            >
              <PanelRightClose class="h-4 w-4" />
            </button>
          </div>
        </header>

        <div class="bg-ppx-bg-subtle/65 relative min-h-0 flex-1 overflow-y-auto p-4">
          <div id="app-right-drawer-body-prepend" class="mb-2" />

          <div
            v-if="loading"
            class="flex h-full min-h-64 flex-col items-center justify-center gap-3"
          >
            <LoaderCircle class="text-ppx-accent h-10 w-10 animate-spin" />
            <span class="text-ppx-text-muted text-sm font-medium">{{ t('common.loading') }}</span>
          </div>

          <div
            v-else-if="error"
            class="animate-fade-in-up flex h-full min-h-64 flex-col items-center justify-center gap-4"
          >
            <div class="workspace-panel flex max-w-xs flex-col items-center gap-3 p-6 text-center">
              <div
                class="bg-ppx-danger-soft flex h-12 w-12 items-center justify-center rounded-full"
              >
                <AlertCircle class="text-ppx-danger h-6 w-6" />
              </div>
              <div>
                <div class="workspace-heading-card">{{ t('drawer.loadFailed') }}</div>
                <p class="workspace-body mt-1">{{ error }}</p>
              </div>
              <AppButton size="sm" variant="outline" tone="rose" @click="hydrateDrawer">
                <RefreshCw class="h-4 w-4" />
                <span>{{ t('actions.refresh') }}</span>
              </AppButton>
            </div>
          </div>

          <DrawerPaperContent
            v-else-if="paper"
            :paper="paper"
            :project-id="uiStore.rightDrawerPayload?.projectId"
            @link="linkPaper"
            @link-to-project="linkPaperToProject"
            @unlink="unlinkPaper"
          />

          <DrawerTaskContent
            v-else-if="task"
            :task="task"
            :trace-sections="traceSections"
            :trace-store-error="traceStore.error"
            :can-cancel="canCancel(task.status)"
            :can-retry="canRetry(task.status)"
            :can-delete="canDelete(task.status)"
            @cancel="taskStore.cancelTask"
            @retry="taskStore.retryTask"
            @delete="deleteTask"
          />

          <DrawerTraceContent v-else-if="trace" :trace="trace" @delete="deleteTraceWithConfirm" />

          <DrawerConversationContent
            v-else-if="conversation"
            :conversation="conversation"
            :turns="conversationTurns"
          />

          <div v-else class="workspace-subpanel workspace-body p-4 text-sm">
            {{ t('drawer.empty') }}
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
