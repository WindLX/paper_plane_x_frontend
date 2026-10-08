import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref, type Ref } from 'vue'

import { useBulkSelection, type BulkSelection } from './useBulkSelection'

function createSelection(scopeKey?: Ref<string>): {
  bulk: BulkSelection
  stop: () => void
} {
  const scope = effectScope()
  const bulk = scope.run(() => useBulkSelection(scopeKey))
  if (!bulk) throw new Error('effect scope did not run')
  return { bulk, stop: () => scope.stop() }
}

describe('useBulkSelection', () => {
  it('toggles, selects, and clears individual ids', () => {
    const { bulk, stop } = createSelection()

    expect(bulk.count).toBe(0)
    expect(bulk.selectedIds).toEqual([])

    bulk.toggle('a')
    bulk.toggle('b')
    expect(bulk.count).toBe(2)
    expect(bulk.isSelected('a')).toBe(true)

    bulk.toggle('a')
    expect(bulk.selectedIds).toEqual(['b'])
    expect(bulk.isSelected('a')).toBe(false)

    bulk.clear()
    expect(bulk.count).toBe(0)
    stop()
  })

  it('tracks page-level select all and partial selection', () => {
    const { bulk, stop } = createSelection()
    const page = ['a', 'b', 'c']

    expect(bulk.isAllSelected(page)).toBe(false)
    expect(bulk.hasPartialSelection(page)).toBe(false)

    bulk.selectMany(['a'])
    expect(bulk.isAllSelected(page)).toBe(false)
    expect(bulk.hasPartialSelection(page)).toBe(true)

    bulk.toggleAll(page)
    expect(bulk.isAllSelected(page)).toBe(true)
    expect(bulk.hasPartialSelection(page)).toBe(false)
    expect(bulk.count).toBe(3)

    bulk.toggleAll(page)
    expect(bulk.count).toBe(0)
    stop()
  })

  it('keeps unrelated selections when unselecting a subset', () => {
    const { bulk, stop } = createSelection()
    bulk.selectMany(['a', 'b', 'c'])

    bulk.unselectMany(['a', 'missing'])

    expect(bulk.selectedIds).toEqual(['b', 'c'])
    stop()
  })

  it('clears the selection when the query or project scope changes', async () => {
    const scopeKey = ref('first')
    const { bulk, stop } = createSelection(scopeKey)

    bulk.selectMany(['a', 'b'])
    expect(bulk.count).toBe(2)

    scopeKey.value = 'second'
    await nextTick()

    expect(bulk.count).toBe(0)
    stop()
  })
})
