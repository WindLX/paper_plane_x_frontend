<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlertCircle, CheckCircle2, Clock3, LibraryBig } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import PaperListTable from '@/components/paper/PaperListTable.vue'
import PaperDrawerContent from '@/components/paper/PaperDrawerContent.vue'
import PaperDrawerWorkspace from '@/components/paper/PaperDrawerWorkspace.vue'
import LibrarySearchPanel from '@/components/library/LibrarySearchPanel.vue'
import LibrarySummaryCards from '@/components/library/LibrarySummaryCards.vue'

import { useNotify } from '@/composables/useNotify'
import { useLibraryList } from '@/composables/useLibraryController'
import { usePaperPdfPane } from '@/composables/usePaperPdfPane'

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
    const selection = resolveLibrarySearchSelection(searchState.value)
    ctrl.searchProjectId = searchState.value.projectScope.trim()
    ctrl.searchSimpleQuery = selection.simpleQuery
    ctrl.searchPaperId = selection.paperId
    ctrl.searchQueryExpr = selection.queryExpr
    searchState.value.executionQuery = selection.executionQuery
    searchState.value.parsedQuery = selection.executionQuery
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
  selectedPaperId.value = null
})
</script>

<template>
  <div class="h-full w-full">
    <PageLayout
      :title="t('library.title')"
      :subtitle="t('library.subtitles')"
      :drawer-open="drawerOpen"
      :drawer-expanded="pdf.layoutOpen"
      :drawer-expanded-width="pdf.width"
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
            @sort="ctrl.paginated.toggleSort"
            @open="openPaperDrawer"
            @close="closePaperDrawer"
          />

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

      <template #drawer>
        <PaperDrawerWorkspace
          v-model:pdf-width="pdf.width"
          :pdf-open="pdf.open"
          :paper-id="selectedPaperId"
          :paper-title="pdf.paperTitle"
          @close-pdf="pdf.close"
          @pdf-closed="pdf.finishClose"
        >
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
        </PaperDrawerWorkspace>
      </template>
    </PageLayout>
  </div>
</template>
