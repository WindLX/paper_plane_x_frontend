import { computed, reactive, ref, watch, type Ref } from 'vue'

/**
 * Multi-row selection for list tables. It is deliberately separate from the
 * single-row detail selection: opening a detail drawer never changes the bulk
 * set, and selecting rows never opens a drawer.
 *
 * Rows are tracked by id, so paging and sorting keep the selection intact. Any
 * change to the query or scope (passed as `scopeKey`) resets the selection.
 */
export function useBulkSelection(scopeKey?: Ref<string>) {
  const selected = ref<Set<string>>(new Set())

  function replace(next: Set<string>): void {
    selected.value = next
  }

  function select(id: string): void {
    if (selected.value.has(id)) return
    const next = new Set(selected.value)
    next.add(id)
    replace(next)
  }

  function unselect(id: string): void {
    if (!selected.value.has(id)) return
    const next = new Set(selected.value)
    next.delete(id)
    replace(next)
  }

  function toggle(id: string): void {
    if (selected.value.has(id)) {
      unselect(id)
    } else {
      select(id)
    }
  }

  function selectMany(ids: string[]): void {
    if (ids.length === 0) return
    const next = new Set(selected.value)
    for (const id of ids) next.add(id)
    replace(next)
  }

  function unselectMany(ids: string[]): void {
    if (ids.length === 0) return
    const next = new Set(selected.value)
    let changed = false
    for (const id of ids) {
      if (next.delete(id)) changed = true
    }
    if (changed) replace(next)
  }

  function isAllSelected(ids: string[]): boolean {
    return ids.length > 0 && ids.every((id) => selected.value.has(id))
  }

  function hasPartialSelection(ids: string[]): boolean {
    return ids.some((id) => selected.value.has(id)) && !isAllSelected(ids)
  }

  function toggleAll(ids: string[]): void {
    if (ids.length === 0) return
    if (isAllSelected(ids)) {
      unselectMany(ids)
    } else {
      selectMany(ids)
    }
  }

  function clear(): void {
    if (selected.value.size === 0) return
    replace(new Set())
  }

  if (scopeKey) {
    watch(scopeKey, () => clear())
  }

  return reactive({
    selectedIds: computed(() => Array.from(selected.value)),
    count: computed(() => selected.value.size),
    isSelected: (id: string) => selected.value.has(id),
    toggle,
    select,
    unselect,
    selectMany,
    unselectMany,
    toggleAll,
    isAllSelected,
    hasPartialSelection,
    clear,
  })
}

export type BulkSelection = ReturnType<typeof useBulkSelection>
