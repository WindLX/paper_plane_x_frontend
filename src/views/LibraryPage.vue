<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlertCircle, CheckCircle2, Clock3, LibraryBig } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import PagerBar from '@/components/PagerBar.vue'
import PaperListTable from '@/components/paper/PaperListTable.vue'
import { useNotify } from '@/composables/useNotify'
import { useLibrarianPapersStore } from '@/stores/librarian/papers'
import { useLibrarianSearchStore } from '@/stores/librarian/search'
import { useUiStore } from '@/stores/ui'
import type { LibrarySearchInputState } from '@/types/api'
import LibrarySearchPanel from '@/components/library/LibrarySearchPanel.vue'
import LibrarySummaryCards from '@/components/library/LibrarySummaryCards.vue'

const { t } = useI18n()
const notify = useNotify()
const uiStore = useUiStore()
const papersStore = useLibrarianPapersStore()
const searchStore = useLibrarianSearchStore()

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

const summaryCards = computed(() => {
  const sc = papersStore.summaryCounts
  return [
    {
      key: 'total',
      label: t('library.cards.total'),
      value: sc.total || papersStore.total,
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

function syncStoreFromState(): void {
  searchStore.searchProjectId = searchState.value.projectScope
  searchStore.searchPaperId = searchState.value.paperId
  searchStore.searchQueryExpr = searchState.value.queryExpr
}

async function runSearch(): Promise<void> {
  syncStoreFromState()
  if (searchState.value.mode === 'simple') {
    const normalized = searchState.value.rawInput.trim()
    searchState.value.queryExpr = normalized
    searchState.value.executionQuery = normalized || null
    searchState.value.parsedQuery = normalized || null
    searchStore.searchQueryExpr = normalized
    searchStore.searchPaperId = ''
  } else {
    searchState.value.executionQuery = searchState.value.queryExpr.trim() || null
    searchState.value.parsedQuery = searchState.value.queryExpr.trim() || null
  }

  try {
    await papersStore.fetchPapers({ offset: 0, limit: papersStore.limit || 20 })
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  }
}

async function clearSearch(): Promise<void> {
  searchState.value.rawInput = ''
  searchState.value.queryExpr = ''
  searchState.value.paperId = ''
  searchState.value.projectScope = ''
  searchState.value.parsedQuery = null
  searchState.value.executionQuery = null
  searchStore.searchProjectId = ''
  searchStore.searchPaperId = ''
  searchStore.searchQueryExpr = ''
  await papersStore.fetchPapers({ offset: 0, limit: papersStore.limit || 20 })
}

function openPaperDrawer(paperId: string): void {
  uiStore.openRightDrawer('paper', { paperId }, 'local')
}

function closePaperDrawer(): void {
  uiStore.closeRightDrawer()
}

async function aiPolish(): Promise<void> {
  const query = searchState.value.rawInput.trim()
  if (!query) return
  aiPolishing.value = true
  try {
    const result = await api.librarianQueryBuilder({
      query,
      project_context: searchState.value.projectScope || null,
    })
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
  () => uiStore.rightDrawerOpen,
  (isOpen) => {
    if (!isOpen) {
      papersStore.selectedPaperId = null
    }
  },
)

onMounted(async () => {
  searchStore.searchProjectId = ''
  searchStore.searchPaperId = ''
  searchStore.searchQueryExpr = ''
  const promises: Promise<unknown>[] = [
    papersStore.fetchPapers({ offset: 0, limit: 20 }),
  ]
  if (!papersStore.statusCounts) {
    promises.push(papersStore.fetchStatusCounts())
  }
  await Promise.allSettled(promises)
})

onBeforeUnmount(() => {
  papersStore.selectedPaperId = null
})
</script>

<template>
  <section class="space-y-4">
    <LibrarySummaryCards :cards="summaryCards" />

    <LibrarySearchPanel
      v-model:search-state="searchState"
      v-model:advanced-open="advancedOpen"
      :ai-polishing="aiPolishing"
      @run-search="runSearch"
      @clear-search="clearSearch"
      @ai-polish="aiPolish"
    />

    <div
      :key="`${searchState.executionQuery}-${papersStore.currentPage}`"
      class="animate-fade-in-up space-y-4"
    >
      <PaperListTable
        v-model:selected-paper-id="papersStore.selectedPaperId"
        :title="t('library.title')"
        :papers="papersStore.papers"
        :offset="papersStore.offset"
        :sort-by="papersStore.sortBy"
        :sort-order="papersStore.sortOrder"
        @sort="papersStore.toggleSort"
        @open="openPaperDrawer"
        @close="closePaperDrawer"
      />

      <PagerBar
        :current-page="papersStore.currentPage"
        :total-pages="papersStore.totalPages"
        :total-count="papersStore.total"
        :rows-per-page="papersStore.limit"
        @prev-page="papersStore.prevPage()"
        @next-page="papersStore.nextPage()"
        @set-page="papersStore.setPage"
        @set-limit="papersStore.setLimit"
      />
    </div>
  </section>
</template>
