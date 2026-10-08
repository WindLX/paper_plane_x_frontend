<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LibraryBig,
  Link2,
  Trash2,
  Unlink2,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import AppButton from '@/components/AppButton.vue'
import BulkActionBar from '@/components/bulk/BulkActionBar.vue'
import BulkConfirmModal from '@/components/bulk/BulkConfirmModal.vue'
import BulkProjectPickerModal from '@/components/bulk/BulkProjectPickerModal.vue'
import BulkResultPanel from '@/components/bulk/BulkResultPanel.vue'
import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import PaperListTable from '@/components/paper/PaperListTable.vue'
import PaperDrawerContent from '@/components/paper/PaperDrawerContent.vue'
import PaperPdfReader from '@/components/paper/PaperPdfReader.vue'
import LibrarySearchPanel from '@/components/library/LibrarySearchPanel.vue'
import LibrarySummaryCards from '@/components/library/LibrarySummaryCards.vue'

import { useNotify } from '@/composables/useNotify'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { useLibraryList } from '@/composables/useLibraryController'
import { usePaperPdfPane } from '@/composables/usePaperPdfPane'
import { usePaperBulkActions, type PaperBulkAction } from '@/composables/usePaperBulkActions'

import { useTasksWsStore } from '@/stores/tasksWs'
import type { LibrarySearchInputState } from '@/types/api'
import {
  LibrarySearchModeConflictError,
  resolveLibrarySearchSelection,
} from '@/utils/librarySearch'

const { t } = useI18n()
const notify = useNotify()
const ctrl = useLibraryList()
const wsStore = useTasksWsStore()

const searchState = ref<LibrarySearchInputState>({
  rawInput: '',
  mode: 'simple',
  queryExpr: '',
  projectScope: '',
  paperId: '',
  parsedQuery: null,
  executionQuery: null,
})
const advancedOpen = ref(false)
const aiPolishing = ref(false)
const selectedPaperId = ref<string | null>(null)
const drawerOpen = ref(false)
const drawerReloadKey = ref(0)
const pdf = usePaperPdfPane()
let pageAlive = true

/* ── Bulk selection ───────────────────────────────────────────── */

const selection = useBulkSelection(
  computed(() =>
    [ctrl.searchProjectId, ctrl.searchPaperId, ctrl.searchSimpleQuery, ctrl.searchQueryExpr].join(
      '\u0000',
    ),
  ),
)
const paperBulk = usePaperBulkActions()
const pickerAction = ref<PaperBulkAction | null>(null)
const pendingAction = ref<PaperBulkAction | null>(null)
const pendingProjectId = ref('')
const pendingIds = ref<string[]>([])

const confirmMeta = computed(() => {
  const action = pendingAction.value
  if (action === 'delete') {
    return {
      title: 'bulk.papers.deleteTitle',
      message: 'bulk.papers.deleteMessage',
      label: 'bulk.actions.delete',
      tone: 'danger' as const,
    }
  }
  if (action === 'link') {
    return {
      title: 'bulk.papers.linkTitle',
      message: 'bulk.papers.linkMessage',
      label: 'bulk.actions.link',
      tone: 'default' as const,
    }
  }
  if (action === 'unlink') {
    return {
      title: 'bulk.papers.unlinkTitle',
      message: 'bulk.papers.unlinkMessage',
      label: 'bulk.actions.unlink',
      tone: 'default' as const,
    }
  }
  return null
})

const pickerTitle = computed(() =>
  pickerAction.value === 'unlink'
    ? t('bulk.actions.pickProjectUnlink')
    : t('bulk.actions.pickProject'),
)

function openProjectPicker(action: PaperBulkAction): void {
  if (paperBulk.running || selection.count === 0) return
  pickerAction.value = action
}

function handleProjectPicked(projectId: string): void {
  const action = pickerAction.value
  pickerAction.value = null
  if (!action) return
  pendingProjectId.value = projectId
  pendingIds.value = [...selection.selectedIds]
  pendingAction.value = action
}

function requestDeletePapers(): void {
  if (paperBulk.running || selection.count === 0) return
  pendingProjectId.value = ''
  pendingIds.value = [...selection.selectedIds]
  pendingAction.value = 'delete'
}

function cancelBulkAction(): void {
  if (paperBulk.running) return
  pendingAction.value = null
  pendingIds.value = []
}

function summarize(entries: Array<{ status: string }>): {
  success: number
  failed: number
  skipped: number
} {
  return {
    success: entries.filter((entry) => entry.status === 'success').length,
    failed: entries.filter((entry) => entry.status === 'failed').length,
    skipped: entries.filter((entry) => entry.status === 'skipped').length,
  }
}

async function refreshPapersAfterBulk(): Promise<void> {
  await ctrl.fetchPapers()
  if (ctrl.paginated.items.length === 0 && ctrl.paginated.offset > 0) {
    await ctrl.fetchPapers({
      offset: Math.max(0, ctrl.paginated.offset - ctrl.paginated.limit),
      limit: ctrl.paginated.limit,
    })
  }
}

async function confirmBulkAction(): Promise<void> {
  const action = pendingAction.value
  const paperIds = [...pendingIds.value]
  const projectId = pendingProjectId.value
  if (!action || paperIds.length === 0) return

  const outcome =
    action === 'delete'
      ? await paperBulk.deletePapers(paperIds)
      : action === 'link'
        ? await paperBulk.linkPapersToProject(projectId, paperIds)
        : await paperBulk.unlinkPapersFromProject(projectId, paperIds)

  if (!pageAlive) return
  pendingAction.value = null
  pendingIds.value = []

  if (!outcome) {
    notify.push(t('bulk.errors.busy'), 'warning', 3200)
    return
  }

  const succeeded = outcome.filter((entry) => entry.status === 'success').map((entry) => entry.item)
  selection.unselectMany(succeeded)

  if (action === 'delete' && selectedPaperId.value && succeeded.includes(selectedPaperId.value)) {
    closePaperDrawer()
  } else if (selectedPaperId.value && succeeded.includes(selectedPaperId.value)) {
    refreshDrawer()
  }

  await refreshPapersAfterBulk()
  if (action === 'delete') {
    void ctrl.fetchStatusCounts(true)
  }

  if (!pageAlive) return
  const counts = summarize(outcome)
  notify.push(
    t('bulk.notifications.completed', counts),
    counts.failed > 0 ? 'warning' : 'success',
    4200,
  )
}

const summaryCards = computed(() => {
  const sc = ctrl.summaryCounts
  return [
    {
      key: 'total',
      label: t('library.cards.total'),
      value: sc.total || ctrl.paginated.total,
      color: 'text-ppx-info',
      icon: LibraryBig,
    },
    {
      key: 'ready',
      label: t('library.cards.ready'),
      value: sc.ready,
      color: 'text-ppx-success',
      icon: CheckCircle2,
    },
    {
      key: 'processing',
      label: t('library.cards.processing'),
      value: sc.processing,
      color: 'text-ppx-warning',
      icon: Clock3,
    },
    {
      key: 'failed',
      label: t('library.cards.failed'),
      value: sc.failed,
      color: 'text-ppx-danger',
      icon: AlertCircle,
    },
  ]
})

function refreshDrawer(): void {
  drawerReloadKey.value += 1
}

async function runSearch(): Promise<void> {
  try {
    const searchSelection = resolveLibrarySearchSelection(searchState.value)
    ctrl.searchProjectId = searchState.value.projectScope.trim()
    ctrl.searchSimpleQuery = searchSelection.simpleQuery
    ctrl.searchPaperId = searchSelection.paperId
    ctrl.searchQueryExpr = searchSelection.queryExpr
    searchState.value.executionQuery = searchSelection.executionQuery
    searchState.value.parsedQuery = searchSelection.executionQuery
  } catch (error) {
    if (error instanceof LibrarySearchModeConflictError) {
      notify.push(t('library.search.modeConflict'), 'warning', 3600)
      return
    }
    throw error
  }

  await ctrl.fetchPapers({ offset: 0, limit: ctrl.paginated.limit || 20 })
}

async function clearSearch(): Promise<void> {
  searchState.value.rawInput = ''
  searchState.value.queryExpr = ''
  searchState.value.paperId = ''
  searchState.value.projectScope = ''
  searchState.value.parsedQuery = null
  searchState.value.executionQuery = null
  ctrl.searchProjectId = ''
  ctrl.searchPaperId = ''
  ctrl.searchSimpleQuery = ''
  ctrl.searchQueryExpr = ''
  await ctrl.fetchPapers({ offset: 0, limit: ctrl.paginated.limit || 20 })
}

async function openPaperDrawer(paperId: string): Promise<void> {
  if (selectedPaperId.value !== paperId) {
    pdf.reset()
  }
  drawerOpen.value = true
  await nextTick()
  selectedPaperId.value = paperId
}

function closePaperDrawer(): void {
  drawerOpen.value = false
  pdf.reset()
}

async function refreshLibrary(): Promise<void> {
  await ctrl.fetchPapers()
}

async function handleLinkPaperToProject([projectId, paperId]: [string, string]): Promise<void> {
  const ok = await ctrl.linkPaperToProject(projectId, paperId)
  if (!ok) {
    return
  }
  refreshDrawer()
  await refreshLibrary()
}

async function handleUnlinkPaper(projectId: string): Promise<void> {
  const paperId = selectedPaperId.value
  if (!paperId) return
  const ok = await ctrl.unlinkPaperFromProject(projectId, paperId)
  if (!ok) {
    return
  }
  refreshDrawer()
  await refreshLibrary()
}

async function aiPolish(): Promise<void> {
  const query = searchState.value.rawInput.trim()
  if (!query) return
  aiPolishing.value = true
  try {
    const result = await ctrl.aiPolishQuery(query, searchState.value.projectScope || null)
    searchState.value.queryExpr = result.query_expr
    searchState.value.parsedQuery = result.query_expr
    searchState.value.executionQuery = result.query_expr
    advancedOpen.value = true
    notify.push(result.explanation, 'info', 4000)
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  } finally {
    aiPolishing.value = false
  }
}

watch(advancedOpen, (isOpen) => {
  searchState.value.mode = isOpen ? 'advanced' : 'simple'
})

watch(
  () => wsStore.lastUpdatedTask,
  () => {
    void refreshLibrary()
  },
)

watch(drawerOpen, (isOpen) => {
  if (!isOpen) {
    selectedPaperId.value = null
  }
})

onMounted(async () => {
  ctrl.searchProjectId = ''
  ctrl.searchPaperId = ''
  ctrl.searchSimpleQuery = ''
  ctrl.searchQueryExpr = ''
  const promises: Promise<unknown>[] = [refreshLibrary()]
  promises.push(ctrl.fetchGuide())
  if (!ctrl.statusCounts) {
    promises.push(ctrl.fetchStatusCounts())
  }
  await Promise.allSettled(promises)
})

onBeforeUnmount(() => {
  pageAlive = false
  selectedPaperId.value = null
})
</script>

<template>
  <div class="h-full w-full">
    <PageLayout
      v-model:drawer-expanded-width="pdf.width"
      :title="t('library.title')"
      :subtitle="t('library.subtitles')"
      :drawer-open="drawerOpen"
      :drawer-expanded="pdf.open"
      @close-drawer="closePaperDrawer"
    >
      <section class="space-y-4">
        <LibrarySummaryCards :cards="summaryCards" />

        <LibrarySearchPanel
          v-model:search-state="searchState"
          v-model:advanced-open="advancedOpen"
          :ai-polishing="aiPolishing"
          :guide="ctrl.guide"
          :guide-loading="ctrl.guideLoading"
          @run-search="runSearch"
          @clear-search="clearSearch"
          @ai-polish="aiPolish"
        />

        <BulkResultPanel
          v-if="paperBulk.rows.length > 0"
          :rows="paperBulk.rows"
          @close="paperBulk.clearResults"
        />

        <div
          :key="`${searchState.executionQuery}-${ctrl.paginated.currentPage}`"
          class="animate-fade-in-up space-y-4"
        >
          <PaperListTable
            v-model:selected-paper-id="selectedPaperId"
            :title="t('library.title')"
            :papers="ctrl.paginated.items"
            :offset="ctrl.paginated.offset"
            :sort-by="ctrl.paginated.sortBy"
            :sort-order="ctrl.paginated.sortOrder"
            :selected-ids="selection.selectedIds"
            :selection-disabled="paperBulk.running"
            @sort="ctrl.paginated.toggleSort"
            @toggle-select="selection.toggle"
            @toggle-select-all="
              selection.toggleAll(ctrl.paginated.items.map((paper) => paper.paper_id))
            "
            @open="openPaperDrawer"
            @close="closePaperDrawer"
          >
            <template v-if="selection.count > 0" #actions>
              <BulkActionBar
                :count="selection.count"
                :busy="paperBulk.running"
                @clear="selection.clear"
              >
                <AppButton
                  size="xs"
                  variant="outline"
                  :disabled="paperBulk.running"
                  @click="openProjectPicker('link')"
                >
                  <Link2 class="h-3.5 w-3.5" />
                  <span>{{ t('bulk.actions.link') }}</span>
                </AppButton>
                <AppButton
                  size="xs"
                  variant="outline"
                  :disabled="paperBulk.running"
                  @click="openProjectPicker('unlink')"
                >
                  <Unlink2 class="h-3.5 w-3.5" />
                  <span>{{ t('bulk.actions.unlink') }}</span>
                </AppButton>
                <AppButton
                  size="xs"
                  variant="outline"
                  tone="rose"
                  :disabled="paperBulk.running"
                  @click="requestDeletePapers"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  <span>{{ t('bulk.actions.delete') }}</span>
                </AppButton>
              </BulkActionBar>
            </template>
          </PaperListTable>

          <PagerBar
            :current-page="ctrl.paginated.currentPage"
            :total-pages="ctrl.paginated.totalPages"
            :total-count="ctrl.paginated.total"
            :rows-per-page="ctrl.paginated.limit"
            @prev-page="ctrl.paginated.prevPage()"
            @next-page="ctrl.paginated.nextPage()"
            @set-page="ctrl.paginated.setPage"
            @set-limit="ctrl.paginated.setLimit"
          />
        </div>
      </section>

      <template #pdf>
        <PaperPdfReader
          v-if="selectedPaperId"
          :paper-id="selectedPaperId"
          :paper-title="pdf.paperTitle"
          @close="pdf.close"
        />
      </template>
      <template #drawer>
        <SlidePanel :title="t('library.detail.paperTitle')" @close="closePaperDrawer">
          <PaperDrawerContent
            v-if="selectedPaperId"
            :paper-id="selectedPaperId"
            :reload-key="drawerReloadKey"
            :pdf-open="pdf.open"
            @unlink="handleUnlinkPaper"
            @link-to-project="handleLinkPaperToProject"
            @refresh-list="refreshLibrary"
            @close="closePaperDrawer"
            @toggle-pdf="pdf.toggle"
          />
        </SlidePanel>
      </template>
    </PageLayout>

    <BulkProjectPickerModal
      :open="pickerAction !== null"
      :title="pickerTitle"
      @select="handleProjectPicked"
      @close="pickerAction = null"
    />

    <BulkConfirmModal
      :open="pendingAction !== null"
      :title="confirmMeta ? t(confirmMeta.title) : ''"
      :message="
        confirmMeta
          ? t(confirmMeta.message, { count: pendingIds.length, projectId: pendingProjectId })
          : ''
      "
      :items="pendingIds"
      :confirm-label="confirmMeta ? t(confirmMeta.label) : ''"
      :tone="confirmMeta?.tone ?? 'default'"
      :busy="paperBulk.running"
      @confirm="confirmBulkAction"
      @close="cancelBulkAction"
    />
  </div>
</template>
