import { computed, ref, type ComputedRef, type Ref } from 'vue'

import type { SortKey, SortOrder } from '@/types/sort'

export interface PaginationParams<S extends SortKey = SortKey> {
  offset: number
  limit: number
  sortOrder?: SortOrder
  sortBy?: S
}

export interface PaginatedResult<TItem> {
  items: TItem[]
  total: number
  offset: number
  limit: number
}

export interface PaginationAPI<
  TItem,
  S extends SortKey,
  TResult extends PaginatedResult<TItem> = PaginatedResult<TItem>,
> {
  items: Ref<TItem[]>
  total: Ref<number>
  offset: Ref<number>
  limit: Ref<number>
  sortOrder: Ref<SortOrder>
  sortBy: Ref<S>
  totalPages: ComputedRef<number>
  currentPage: ComputedRef<number>
  hasPrevPage: ComputedRef<boolean>
  hasNextPage: ComputedRef<boolean>
  fetch: (options?: {
    offset?: number
    limit?: number
    sortOrder?: SortOrder
    sortBy?: S
  }) => Promise<TResult>
  setPage: (page: number) => Promise<void>
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  setLimit: (nextLimit: number) => Promise<void>
  toggleSort: (field: S) => Promise<void>
}

export interface UsePaginationOptions<
  TItem,
  S extends SortKey,
  TResult extends PaginatedResult<TItem> = PaginatedResult<TItem>,
> {
  fetcher: (params: PaginationParams<S>) => Promise<TResult>
  defaultLimit?: number
  defaultSortBy?: S
}

/** Backend-driven pagination with sorting. `fetch()` returns the raw payload so callers can extract extra fields. */
export function usePagination<
  TItem,
  S extends SortKey,
  TResult extends PaginatedResult<TItem> = PaginatedResult<TItem>,
>(options: UsePaginationOptions<TItem, S, TResult>): PaginationAPI<TItem, S, TResult> {
  const { fetcher, defaultLimit = 20, defaultSortBy } = options

  const items = ref<TItem[]>([]) as Ref<TItem[]>
  const total = ref(0)
  const offset = ref(0)
  const limit = ref(defaultLimit)
  const sortOrder = ref<SortOrder>('default')
  const sortBy = ref<S>(defaultSortBy ?? (null as S))

  const totalPages = computed(() => {
    if (limit.value <= 0) return 1
    return Math.max(1, Math.ceil(total.value / limit.value))
  })
  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
  const hasPrevPage = computed(() => offset.value > 0)
  const hasNextPage = computed(() => offset.value + limit.value < total.value)

  async function fetch(opts?: {
    offset?: number
    limit?: number
    sortOrder?: SortOrder
    sortBy?: S
  }): Promise<TResult> {
    const nextOffset = opts?.offset ?? offset.value
    const nextLimit = opts?.limit ?? limit.value
    const nextSortOrder = opts?.sortOrder ?? sortOrder.value
    const nextSortBy = opts?.sortBy !== undefined ? opts.sortBy : sortBy.value

    const payload = await fetcher({
      offset: nextOffset,
      limit: nextLimit,
      sortOrder: nextSortOrder === 'default' ? undefined : nextSortOrder,
      sortBy: nextSortBy ?? undefined,
    })

    items.value = payload.items
    total.value = payload.total
    offset.value = payload.offset
    limit.value = payload.limit
    sortOrder.value = nextSortOrder
    sortBy.value = nextSortBy

    return payload
  }

  async function setPage(page: number): Promise<void> {
    const targetPage = Math.max(1, Math.min(page, totalPages.value))
    const nextOffset = (targetPage - 1) * limit.value
    await fetch({ offset: nextOffset, limit: limit.value })
  }

  async function nextPage(): Promise<void> {
    if (!hasNextPage.value) return
    await fetch({ offset: offset.value + limit.value, limit: limit.value })
  }

  async function prevPage(): Promise<void> {
    if (!hasPrevPage.value) return
    await fetch({ offset: Math.max(0, offset.value - limit.value), limit: limit.value })
  }

  async function setLimit(nextLimit: number): Promise<void> {
    const normalized = Math.max(1, Math.min(nextLimit, 200))
    await fetch({ offset: 0, limit: normalized })
  }

  async function toggleSort(field: S): Promise<void> {
    if (field === null) return
    const key = field as NonNullable<S>
    let nextSortBy: S
    let nextSortOrder: SortOrder

    if (sortBy.value !== key) {
      nextSortBy = key
      nextSortOrder = 'desc'
    } else if (sortOrder.value === 'default') {
      nextSortBy = key
      nextSortOrder = 'desc'
    } else if (sortOrder.value === 'desc') {
      nextSortBy = key
      nextSortOrder = 'asc'
    } else {
      nextSortBy = null as S
      nextSortOrder = 'default'
    }

    await fetch({ offset: 0, limit: limit.value, sortOrder: nextSortOrder, sortBy: nextSortBy })
  }

  return {
    items,
    total,
    offset,
    limit,
    sortOrder,
    sortBy: sortBy as Ref<S>,
    totalPages,
    currentPage,
    hasPrevPage,
    hasNextPage,
    fetch,
    setPage,
    nextPage,
    prevPage,
    setLimit,
    toggleSort,
  }
}

// ── Frontend-only pagination ────────────────────────────────────────────────

export interface FrontendPaginationAPI<TItem, S extends SortKey = SortKey> {
  items: ComputedRef<TItem[]>
  total: ComputedRef<number>
  offset: Ref<number>
  limit: Ref<number>
  sortOrder: Ref<SortOrder>
  sortBy: Ref<S>
  totalPages: ComputedRef<number>
  currentPage: ComputedRef<number>
  hasPrevPage: ComputedRef<boolean>
  hasNextPage: ComputedRef<boolean>
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setLimit: (nextLimit: number) => void
  reset: () => void
  toggleSort: (field: S) => void
}

export interface UseFrontendPaginationOptions<TItem, S extends SortKey = SortKey> {
  sourceItems: Ref<TItem[]> | ComputedRef<TItem[]>
  defaultLimit?: number
  defaultSortBy?: S
  comparator?: (a: TItem, b: TItem, sortBy: S, sortOrder: SortOrder) => number
}

/** Client-side pagination for data already fully loaded in memory. Supports optional client-side sorting. */
export function useFrontendPagination<TItem, S extends SortKey = SortKey>(
  options: UseFrontendPaginationOptions<TItem, S>,
): FrontendPaginationAPI<TItem, S> {
  const { sourceItems, defaultLimit = 20, defaultSortBy, comparator } = options

  const offset = ref(0)
  const limit = ref(defaultLimit)
  const sortOrder = ref<SortOrder>('default')
  const sortBy = ref<S>(defaultSortBy ?? (null as S))
  const total = computed(() => sourceItems.value.length)

  const totalPages = computed(() => {
    if (limit.value <= 0) return 1
    return Math.max(1, Math.ceil(total.value / limit.value))
  })
  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
  const hasPrevPage = computed(() => offset.value > 0)
  const hasNextPage = computed(() => offset.value + limit.value < total.value)

  const items = computed(() => {
    let data = sourceItems.value
    if (comparator && sortBy.value !== null && sortOrder.value !== 'default') {
      data = [...data].sort((a, b) => comparator(a, b, sortBy.value, sortOrder.value))
    }
    return data.slice(offset.value, offset.value + limit.value)
  })

  function setPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, totalPages.value))
    offset.value = (clamped - 1) * limit.value
  }

  function nextPage(): void {
    if (!hasNextPage.value) return
    offset.value = offset.value + limit.value
  }

  function prevPage(): void {
    if (!hasPrevPage.value) return
    offset.value = Math.max(0, offset.value - limit.value)
  }

  function setLimit(nextLimit: number): void {
    limit.value = Math.max(1, Math.min(nextLimit, 200))
    offset.value = 0
  }

  function reset(): void {
    offset.value = 0
  }

  function toggleSort(field: S): void {
    if (field === null) return
    const key = field as NonNullable<S>
    let nextSortBy: S
    let nextSortOrder: SortOrder

    if (sortBy.value !== key) {
      nextSortBy = key
      nextSortOrder = 'desc'
    } else if (sortOrder.value === 'default') {
      nextSortBy = key
      nextSortOrder = 'desc'
    } else if (sortOrder.value === 'desc') {
      nextSortBy = key
      nextSortOrder = 'asc'
    } else {
      nextSortBy = null as S
      nextSortOrder = 'default'
    }

    sortBy.value = nextSortBy
    sortOrder.value = nextSortOrder
    offset.value = 0
  }

  return {
    items,
    total,
    offset,
    limit,
    sortOrder,
    sortBy: sortBy as Ref<S>,
    totalPages,
    currentPage,
    hasPrevPage,
    hasNextPage,
    setPage,
    nextPage,
    prevPage,
    setLimit,
    reset,
    toggleSort,
  }
}
