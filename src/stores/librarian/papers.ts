import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '@/api'
import { usePagination } from '@/composables/usePagination'
import { useLibrarianSearchStore } from '@/stores/librarian/search'
import type { PaperListResponse, PaperResponse, PaperStatusCountResponse } from '@/types/api'
import type { PaperSortKey } from '@/types/sort'

export const useLibrarianPapersStore = defineStore('librarian-papers', () => {
  const searchStore = useLibrarianSearchStore()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedPaperId = ref<string | null>(null)
  const statusCounts = ref<PaperStatusCountResponse | null>(null)
  const statusCountsLoading = ref(false)

  const summaryCounts = computed(() => {
    const sc = statusCounts.value
    return {
      total: sc?.total ?? 0,
      ready: (sc?.extraction_completed ?? 0) + (sc?.extraction_human_completed ?? 0),
      processing:
        (sc?.extraction_pending ?? 0) +
        (sc?.extraction_processing ?? 0) +
        (sc?.extraction_fact_check_pending ?? 0) +
        (sc?.analysis_fact_check_pending ?? 0),
      failed:
        (sc?.extraction_failed ?? 0) +
        (sc?.extraction_fact_check_failed ?? 0) +
        (sc?.analysis_fact_check_failed ?? 0),
    }
  })

  const paginated = usePagination<PaperResponse, PaperSortKey, PaperListResponse>({
    fetcher: async ({ offset, limit, sortOrder, sortBy }) => {
      const projectId = searchStore.searchProjectId.trim() || undefined
      const paperId = searchStore.searchPaperId.trim() || undefined
      const queryExpr = searchStore.searchQueryExpr.trim() || undefined

      const result = await api.librarianSearch({
        project_id: projectId ?? null,
        paper_id: paperId ?? null,
        query_expr: paperId ? null : (queryExpr ?? null),
        limit,
        offset,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (result.paper_ids.length === 0) {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 0,
        }
      }

      const papers = await api.batchGetPapers(result.paper_ids, 0, result.paper_ids.length)
      return {
        items: papers.items,
        total: result.total,
        offset: result.offset,
        limit: result.limit,
      }
    },
    defaultLimit: 20,
  })

  async function fetchPapers(options?: Parameters<typeof paginated.fetch>[0]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await paginated.fetch(options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch search results.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function linkProjectPaper(paperId: string): Promise<void> {
    await api.linkProjectPaper(searchStore.searchProjectId, paperId)
    await paginated.fetch()
  }

  async function unlinkProjectPaper(paperId: string): Promise<void> {
    await api.unlinkProjectPaper(searchStore.searchProjectId, paperId)
    await paginated.fetch()
  }

  async function fetchStatusCounts(force = false): Promise<void> {
    if (!force && statusCounts.value !== null) return
    statusCountsLoading.value = true
    try {
      statusCounts.value = await api.getPaperStatusCounts()
    } catch {
      statusCounts.value = null
    } finally {
      statusCountsLoading.value = false
    }
  }

  return {
    loading,
    error,
    selectedPaperId,
    statusCounts,
    statusCountsLoading,
    summaryCounts,
    papers: paginated.items,
    total: paginated.total,
    offset: paginated.offset,
    limit: paginated.limit,
    sortOrder: paginated.sortOrder,
    sortBy: paginated.sortBy,
    totalPages: paginated.totalPages,
    currentPage: paginated.currentPage,
    hasPrevPage: paginated.hasPrevPage,
    hasNextPage: paginated.hasNextPage,
    setPage: paginated.setPage,
    nextPage: paginated.nextPage,
    prevPage: paginated.prevPage,
    setLimit: paginated.setLimit,
    toggleSort: paginated.toggleSort,
    fetchPapers,
    linkProjectPaper,
    unlinkProjectPaper,
    fetchStatusCounts,
  }
})
