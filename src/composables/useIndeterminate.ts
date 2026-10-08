import { watchEffect, type Ref } from 'vue'

/**
 * Mirrors a reactive flag onto the native checkbox `indeterminate` property.
 *
 * `indeterminate` is a DOM property rather than an attribute, so template
 * bindings never apply it and each render can silently drop it. Re-applying the
 * current value whenever the input ref or the flag changes keeps the checkbox
 * deterministic, including clearing it back to `false`.
 */
export function useIndeterminate<T extends { indeterminate: boolean }>(
  input: Ref<T | null>,
  isIndeterminate: () => boolean,
): void {
  watchEffect(() => {
    if (input.value) {
      input.value.indeterminate = isIndeterminate()
    }
  })
}
