import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { useIndeterminate } from './useIndeterminate'

/** Minimal stand-in for the native property the composable writes to. */
type IndeterminateTarget = { indeterminate: boolean }

function fakeInput(): IndeterminateTarget {
  return { indeterminate: false }
}

describe('useIndeterminate', () => {
  it('applies the flag once the input ref is populated', async () => {
    const input = fakeInput()
    const inputRef = ref<IndeterminateTarget | null>(null)
    const flag = ref(true)
    const scope = effectScope()
    scope.run(() => useIndeterminate(inputRef, () => flag.value))

    expect(input.indeterminate).toBe(false)

    inputRef.value = input
    await nextTick()

    expect(input.indeterminate).toBe(true)
    scope.stop()
  })

  it('re-applies the flag whenever it changes, including back to false', async () => {
    const input = fakeInput()
    const inputRef = ref<IndeterminateTarget | null>(input)
    const flag = ref(false)
    const scope = effectScope()
    scope.run(() => useIndeterminate(inputRef, () => flag.value))
    await nextTick()

    expect(input.indeterminate).toBe(false)

    flag.value = true
    await nextTick()
    expect(input.indeterminate).toBe(true)

    flag.value = false
    await nextTick()
    expect(input.indeterminate).toBe(false)
    scope.stop()
  })
})
