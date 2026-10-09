import { computed, onScopeDispose, reactive, ref, watch, type Ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type {
  ProjectActivity,
  ProjectActivityCategory,
  ProjectActivityQuery,
  ProjectActivityStatus,
} from '@/types/api'

export const ACTIVITY_PAGE_SIZE = 20

export interface ProjectActivityFilters {
  category: ProjectActivityCategory | null
  status: ProjectActivityStatus | null
  created_at_from: string
  created_at_to: string
  keyword: string
}

function emptyFilters(): ProjectActivityFilters {
  return {
    category: null,
    status: null,
    created_at_from: '',
    created_at_to: '',
    keyword: '',
  }
}

/** Compact, filterable activity feed backed by GET /projects/{id}/activities. */
export function useProjectActivities(projectId: Ref<string>) {
  const items = ref<ProjectActivity[]>([])
  const total = ref(0)
  const offset = ref(0)
  const limit = ref(ACTIVITY_PAGE_SIZE)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = reactive<ProjectActivityFilters>(emptyFilters())
  let request = 0

  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))
  const hasPrevPage = computed(() => offset.value > 0)
  const hasNextPage = computed(() => offset.value + limit.value < total.value)

  function buildQuery(nextOffset: number): ProjectActivityQuery {
    return {
      offset: nextOffset,
      limit: limit.value,
      category: filters.category ?? undefined,
      status: filters.status ?? undefined,
      created_at_from: filters.created_at_from ? `${filters.created_at_from}T00:00:00` : undefined,
      created_at_to: filters.created_at_to ? `${filters.created_at_to}T23:59:59.999999` : undefined,
      keyword: filters.keyword.trim() || undefined,
    }
  }

  async function load(nextOffset = offset.value): Promise<void> {
    if (!projectId.value) return
    const current = ++request
    loading.value = true
    error.value = null
    try {
      const response = await api.listProjectActivities(projectId.value, buildQuery(nextOffset))
      if (current !== request) return
      items.value = response.items
      total.value = response.total
      offset.value = response.offset
      limit.value = response.limit
    } catch (err) {
      if (current !== request) return
      error.value = err instanceof Error ? err.message : translate('workbench.activity.loadFailed')
    } finally {
      if (current === request) loading.value = false
    }
  }

  function applyFilters(): void {
    offset.value = 0
    void load(0)
  }

  function resetFilters(): void {
    Object.assign(filters, emptyFilters())
    offset.value = 0
    void load(0)
  }

  async function setLimit(rows: number): Promise<void> {
    limit.value = rows
    await load(0)
  }

  async function setPage(page: number): Promise<void> {
    const target = Math.max(1, Math.min(Math.trunc(page) || 1, totalPages.value))
    await load((target - 1) * limit.value)
  }

  async function nextPage(): Promise<void> {
    if (hasNextPage.value) await load(offset.value + limit.value)
  }

  async function prevPage(): Promise<void> {
    if (hasPrevPage.value) await load(Math.max(0, offset.value - limit.value))
  }

  watch(
    projectId,
    () => {
      request++
      Object.assign(filters, emptyFilters())
      offset.value = 0
      items.value = []
      total.value = 0
    },
    { immediate: true },
  )
  onScopeDispose(() => {
    request++
  })

  return {
    items,
    total,
    offset,
    limit,
    loading,
    error,
    filters,
    currentPage,
    totalPages,
    hasPrevPage,
    hasNextPage,
    load,
    applyFilters,
    resetFilters,
    setPage,
    setLimit,
    nextPage,
    prevPage,
  }
}
