<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertCircle, CheckCircle2, Clock3, LibraryBig } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import LibrarySearchPanel from '@/components/library/LibrarySearchPanel.vue'
import LibrarySummaryCards from '@/components/library/LibrarySummaryCards.vue'
import PaperListTable from '@/components/paper/PaperListTable.vue'
import { useNotify } from '@/composables/useNotify'
import { useLibraryList } from '@/composables/useLibraryController'
import { useTasksWsStore } from '@/stores/tasksWs'
import type { LibrarySearchInputState } from '@/types/api'
import {
  LibrarySearchModeConflictError,
  resolveLibrarySearchSelection,
} from '@/utils/librarySearch'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  openDrawer: [paperId: string]
}>()

const { t } = useI18n()
const notify = useNotify()
const ctrl = useLibraryList()
const wsStore = useTasksWsStore()

const searchState = ref<LibrarySearchInputState>({
  rawInput: '',
  mode: 'simple',
  queryExpr: '',
  projectScope: props.projectId,
  paperId: '',
  parsedQuery: null,
  executionQuery: null,
})
const advancedOpen = ref(false)
const aiPolishing = ref(false)
const selectedPaperId = ref<string | null>(null)

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

async function runSearch(): Promise<void> {
  try {
    const selection = resolveLibrarySearchSelection(searchState.value)
    ctrl.searchProjectId = props.projectId
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
  searchState.value.projectScope = props.projectId
  searchState.value.parsedQuery = null
  searchState.value.executionQuery = null
  ctrl.searchProjectId = props.projectId
  ctrl.searchPaperId = ''
  ctrl.searchSimpleQuery = ''
  ctrl.searchQueryExpr = ''
  await ctrl.fetchPapers({ offset: 0, limit: ctrl.paginated.limit || 20 })
}

function openPaperDrawer(paperId: string): void {
  selectedPaperId.value = paperId
  emit('openDrawer', paperId)
}

async function refreshLibrary(): Promise<void> {
  await ctrl.fetchPapers()
}

async function aiPolish(): Promise<void> {
  const query = searchState.value.rawInput.trim()
  if (!query) return
  aiPolishing.value = true
  try {
    const result = await ctrl.aiPolishQuery(query, props.projectId)
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

watch(
  () => props.projectId,
  () => {
    ctrl.searchProjectId = props.projectId
    searchState.value.projectScope = props.projectId
    selectedPaperId.value = null
    void refreshLibrary()
    void ctrl.fetchStatusCounts(false, props.projectId)
  },
)

onMounted(async () => {
  ctrl.searchProjectId = props.projectId
  ctrl.searchPaperId = ''
  ctrl.searchSimpleQuery = ''
  ctrl.searchQueryExpr = ''
  const promises: Promise<unknown>[] = [refreshLibrary()]
  promises.push(ctrl.fetchGuide())
  if (!ctrl.statusCounts) {
    promises.push(ctrl.fetchStatusCounts(false, props.projectId))
  }
  await Promise.allSettled(promises)
})
</script>

<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <LibrarySummaryCards :cards="summaryCards" />

        <LibrarySearchPanel
          v-model:search-state="searchState"
          v-model:advanced-open="advancedOpen"
          :ai-polishing="aiPolishing"
          :guide="ctrl.guide"
          :guide-loading="ctrl.guideLoading"
          hide-project-scope
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
      </div>
    </div>
  </section>
</template>
