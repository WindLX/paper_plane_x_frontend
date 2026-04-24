import { ref } from 'vue'

export type TriSortOrder = 'default' | 'desc' | 'asc'

export function nextTriSortOrder(current: TriSortOrder): TriSortOrder {
  if (current === 'default') return 'desc'
  if (current === 'desc') return 'asc'
  return 'default'
}

export function useTriSort<T extends string>(
  initialField: T | 'none' = 'none',
  initialOrder: TriSortOrder = 'default',
) {
  const sortField = ref<T | 'none'>(initialField)
  const sortOrder = ref<TriSortOrder>(initialOrder)

  function toggleSort(field: T): void {
    if (sortField.value !== field) {
      sortField.value = field
      sortOrder.value = 'desc'
      return
    }

    sortOrder.value = nextTriSortOrder(sortOrder.value)
    if (sortOrder.value === 'default') {
      sortField.value = 'none'
    }
  }

  return {
    sortField,
    sortOrder,
    toggleSort,
  }
}
