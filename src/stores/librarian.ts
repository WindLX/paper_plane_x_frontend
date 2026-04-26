import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type {
    LibrarianGlobalFinderPaperSummary,
    LibrarianGlobalFinderResponse,
    LibrarianMatrixResponse,
    LibrarianProjectionResponse,
    PaperResponse,
    PaperListResponse
} from '../types/api'
import { api } from '../api/client'
import { useFrontendPagination, usePagination } from '../composables/pagination'
import type { GlobalFinderSortKey, PaperSortKey, SortOrder } from '../types/sort'

export type LibrarianTab = 'globalFinder' | 'search' | 'projection' | 'matrix'

export const useLibrarianStore = defineStore('librarian', () => {
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Active tab
    const activeTab = ref<LibrarianTab>('globalFinder')

    // ── Search state helpers ──────────────────────────────────────────────
    function clearSearch(): void {
        searchPaperId.value = ''
        searchQueryExpr.value = ''
        paginated.fetch({ offset: 0 })
    }

    async function linkProjectPaper(paperId: string): Promise<void> {
        await api.linkProjectPaper(searchProjectId.value, paperId)
        await paginated.fetch()
    }

    async function unlinkProjectPaper(paperId: string): Promise<void> {
        await api.unlinkProjectPaper(searchProjectId.value, paperId)
        await paginated.fetch()
    }

    // ── SearchTab ──────────────────────────────────────────────────────────
    const searchProjectId = ref('')
    const searchPaperId = ref('')
    const searchQueryExpr = ref('')
    const selectedPaperId = ref<string | null>(null)

    const paginated = usePagination<PaperResponse, PaperSortKey, PaperListResponse>({
        fetcher: async ({ offset, limit, sortOrder, sortBy }) => {
            const projectId = searchProjectId.value.trim() || undefined
            const paperId = searchPaperId.value.trim() || undefined
            const queryExpr = searchQueryExpr.value.trim() || undefined

            const result = await api.librarianSearch({
                project_id: projectId ?? null,
                paper_id: paperId ?? null,
                query_expr: paperId ? null : (queryExpr ?? null),
                limit: limit,
                offset: offset,
                sort_by: sortBy,
                sort_order: sortOrder,
            })
            if (result.paper_ids.length > 0) {
                const papers = await api.batchGetPapers(result.paper_ids, 0, result.paper_ids.length)
                return {
                    items: papers.items,
                    total: result.total,
                    offset: result.offset,
                    limit: result.limit,
                }
            } else {
                return {
                    items: [],
                    total: 0,
                    offset: 0,
                    limit: 0,
                }
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
        } finally {
            loading.value = false
        }
    }

    // ── MatrixTab ──────────────────────────────────────────────────────────
    const matrixPaperIds = ref('')
    const matrixFieldPaths = ref('meta.title\nsynthesis_data.review_summary')
    const matrixResult = ref<LibrarianMatrixResponse | null>(null)

    // ── ProjectionTab ──────────────────────────────────────────────────────
    const projectionPaperId = ref('')
    const projectionFieldPath = ref('meta.title')
    const projectionResult = ref<LibrarianProjectionResponse | null>(null)

    // ── GlobalFinderTab ────────────────────────────────────────────────────
    const globalFinderProjectId = ref('')
    const globalFinderResult = ref<LibrarianGlobalFinderResponse | null>(null)

    const globalFinderPapers = computed(() => globalFinderResult.value?.papers ?? [])

    function globalFinderComparator(
        a: LibrarianGlobalFinderPaperSummary,
        b: LibrarianGlobalFinderPaperSummary,
        sortBy: GlobalFinderSortKey,
        sortOrder: SortOrder,
    ): number {
        let cmp = 0
        if (sortBy === 'title') {
            cmp = (a.title ?? '').localeCompare(b.title ?? '')
        } else if (sortBy === 'year') {
            const ay = a.year ?? -Infinity
            const by = b.year ?? -Infinity
            cmp = ay - by
        } else if (sortBy === 'verdict') {
            const av = a.quick_scan?.verdict ?? ''
            const bv = b.quick_scan?.verdict ?? ''
            cmp = av.localeCompare(bv)
        }
        return sortOrder === 'asc' ? cmp : -cmp
    }

    const globalFinderPagination = useFrontendPagination<LibrarianGlobalFinderPaperSummary, GlobalFinderSortKey>({
        sourceItems: globalFinderPapers,
        defaultLimit: 20,
        defaultSortBy: null,
        comparator: globalFinderComparator,
    })

    function setGlobalFinderProjectId(value: string): void {
        globalFinderProjectId.value = value
        globalFinderPagination.reset()
    }

    // ── Common ─────────────────────────────────────────────────────────────
    function setActiveTab(tab: LibrarianTab): void {
        activeTab.value = tab
    }

    return {
        loading,
        error,
        activeTab,
        // Papers
        selectedPaperId,
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
        // Search
        searchProjectId,
        searchPaperId,
        searchQueryExpr,
        clearSearch,
        // Matrix
        matrixPaperIds,
        matrixFieldPaths,
        matrixResult,
        // Projection
        projectionPaperId,
        projectionFieldPath,
        projectionResult,
        // GlobalFinder
        globalFinderProjectId,
        globalFinderResult,
        globalFinderPapers: globalFinderPagination.items,
        globalFinderTotal: globalFinderPagination.total,
        globalFinderOffset: globalFinderPagination.offset,
        globalFinderLimit: globalFinderPagination.limit,
        globalFinderSortBy: globalFinderPagination.sortBy,
        globalFinderSortOrder: globalFinderPagination.sortOrder,
        globalFinderToggleSort: globalFinderPagination.toggleSort,
        globalFinderTotalPages: globalFinderPagination.totalPages,
        globalFinderCurrentPage: globalFinderPagination.currentPage,
        globalFinderHasPrevPage: globalFinderPagination.hasPrevPage,
        globalFinderHasNextPage: globalFinderPagination.hasNextPage,
        globalFinderSetPage: globalFinderPagination.setPage,
        globalFinderNextPage: globalFinderPagination.nextPage,
        globalFinderPrevPage: globalFinderPagination.prevPage,
        globalFinderSetLimit: globalFinderPagination.setLimit,
        setGlobalFinderProjectId,
        // Common
        setActiveTab,
    }
})
