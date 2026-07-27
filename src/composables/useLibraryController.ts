import { computed, onBeforeUnmount, reactive, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import { translate } from '@/i18n'
import { usePagination } from '@/composables/usePagination'
import { useNotify } from '@/composables/useNotify'
import type {
  PaperDetailResponse,
  LibrarianGuideResponse,
  PaperListResponse,
  PaperResponse,
  PaperStatusCountResponse,
} from '@/types/api'
import type { PaperSortKey } from '@/types/sort'

export type LibraryListController = ReturnType<typeof useLibraryList>
export type LibraryDetailController = ReturnType<typeof useLibraryDetail>

export function useLibraryList() {
  const statusCounts = ref<PaperStatusCountResponse | null>(null)
  const statusCountsLoading = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const guide = ref<LibrarianGuideResponse | null>(null)
  const guideLoading = ref(false)
  const notify = useNotify()

  // Search state (merged from old librarian/search store)
  const searchProjectId = ref('')
  const searchPaperId = ref('')
  const searchSimpleQuery = ref('')
  const searchQueryExpr = ref('')

  const paginated = usePagination<PaperResponse, PaperSortKey, PaperListResponse>({
    fetcher: async ({ offset, limit, sortOrder, sortBy }) => {
      const projectId = searchProjectId.value.trim() || undefined
      const paperId = searchPaperId.value.trim() || undefined
      const simpleQuery = searchSimpleQuery.value.trim() || undefined
      const queryExpr = searchQueryExpr.value.trim() || undefined

      const result = await api.librarianSearch({
        project_id: projectId ?? null,
        paper_id: paperId ?? null,
        simple_query: simpleQuery ?? null,
        query_expr: queryExpr ?? null,
        limit,
        offset,
        sort_by: sortBy,
        sort_order: sortOrder,
        only_completed: false,
      })

      if (result.paper_ids.length === 0) {
        return {
          items: [],
          total: 0,
          offset: result.offset,
          limit: result.limit,
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

  async function fetchPapers(options?: Parameters<typeof paginated.fetch>[0]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await paginated.fetch(options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('library.errors.fetchPapers')
      notify.push(error.value, 'error', 3600)
    } finally {
      loading.value = false
    }
  }

  async function linkPaperToProject(projectId: string, paperId: string): Promise<boolean> {
    try {
      await api.linkProjectPaper(projectId, paperId)
      await paginated.fetch()
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translate('library.errors.linkPaperToProject')
      error.value = message
      notify.push(message, 'error', 3600)
      return false
    }
  }

  async function unlinkPaperFromProject(projectId: string, paperId: string): Promise<boolean> {
    try {
      await api.unlinkProjectPaper(projectId, paperId)
      await paginated.fetch()
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translate('library.errors.unlinkPaperFromProject')
      error.value = message
      notify.push(message, 'error', 3600)
      return false
    }
  }

  async function fetchStatusCounts(force = false, projectId?: string): Promise<void> {
    if (!force && statusCounts.value !== null) return
    statusCountsLoading.value = true
    try {
      statusCounts.value = projectId
        ? await api.getProjectPaperStatusCounts(projectId)
        : await api.getPaperStatusCounts()
    } catch (err) {
      statusCounts.value = null
      const message =
        err instanceof Error ? err.message : translate('library.errors.fetchStatusCounts')
      notify.push(message, 'error', 3600)
    } finally {
      statusCountsLoading.value = false
    }
  }

  async function aiPolishQuery(
    query: string,
    projectContext: string | null,
  ): Promise<{
    query_expr: string
    explanation: string
  }> {
    return await api.librarianQueryBuilder({
      query,
      project_context: projectContext,
    })
  }

  async function fetchGuide(): Promise<void> {
    if (guide.value || guideLoading.value) return
    guideLoading.value = true
    try {
      guide.value = await api.getLibrarianGuide()
    } catch (err) {
      const message = err instanceof Error ? err.message : translate('library.errors.fetchGuide')
      notify.push(message, 'error', 3600)
    } finally {
      guideLoading.value = false
    }
  }

  return reactive({
    statusCounts,
    statusCountsLoading,
    loading,
    error,
    guide,
    guideLoading,
    summaryCounts,
    searchProjectId,
    searchPaperId,
    searchSimpleQuery,
    searchQueryExpr,
    paginated,
    fetchPapers,
    linkPaperToProject,
    unlinkPaperFromProject,
    fetchStatusCounts,
    aiPolishQuery,
    fetchGuide,
  })
}

export function useLibraryDetail(paperId: Ref<string | null>) {
  const { t } = useI18n()
  const notify = useNotify()

  const paper = ref<PaperDetailResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let abortFlag = 0

  onBeforeUnmount(() => {
    abortFlag++
  })

  async function loadPaper(): Promise<PaperDetailResponse | null> {
    if (!paperId.value) {
      paper.value = null
      error.value = null
      abortFlag++
      return null
    }

    abortFlag++
    const myFlag = abortFlag

    loading.value = true
    error.value = null
    try {
      const result = await api.getPaper(paperId.value)
      if (myFlag !== abortFlag) return null
      paper.value = result
      return result
    } catch (err) {
      if (myFlag !== abortFlag) return null
      paper.value = null
      error.value = err instanceof Error ? err.message : t('library.errors.fetchPaperDetail')
      notify.push(error.value, 'error', 3600)
      return null
    } finally {
      if (myFlag === abortFlag) {
        loading.value = false
      }
    }
  }

  async function deletePaper(): Promise<boolean> {
    if (!paperId.value) return false
    try {
      await api.deletePaper(paperId.value)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : t('library.errors.deletePaper')
      error.value = message
      notify.push(message, 'error', 3600)
      return false
    }
  }

  return reactive({
    paper,
    loading,
    error,
    loadPaper,
    deletePaper,
  })
}
