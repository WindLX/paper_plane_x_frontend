<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useIndeterminate } from '@/composables/useIndeterminate'

const props = withDefaults(
  defineProps<{
    /** Checked state; the control stays controlled by its parent. */
    checked?: boolean
    /** Tri-state marker; rendered as a dash and applied to the native property. */
    indeterminate?: boolean
    disabled?: boolean
    /** Accessible name; always required because the control has no visible label. */
    label: string
    /** Accessible name used when the box is checked. */
    checkedLabel?: string
    /** Accessible name used while the box is indeterminate. */
    indeterminateLabel?: string
    /** Accessible name used when the box cannot be toggled. */
    disabledLabel?: string
  }>(),
  {
    checked: false,
    indeterminate: false,
    disabled: false,
    checkedLabel: undefined,
    indeterminateLabel: undefined,
    disabledLabel: undefined,
  },
)

const inputRef = ref<HTMLInputElement | null>(null)

useIndeterminate(inputRef, () => props.indeterminate)

// The name follows the state so assistive technology announces both the row and
// what the control currently means; the disabled name wins over the rest.
const accessibleLabel = computed(() => {
  if (props.disabled && props.disabledLabel) return props.disabledLabel
  if (props.indeterminate && props.indeterminateLabel) return props.indeterminateLabel
  if (props.checked && props.checkedLabel) return props.checkedLabel
  return props.label
})
</script>

<template>
  <span class="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
    <input
      ref="inputRef"
      type="checkbox"
      class="peer bg-ppx-bg-elevated border-ppx-border-strong checked:border-ppx-accent checked:bg-ppx-accent indeterminate:border-ppx-accent indeterminate:bg-ppx-accent focus-visible:ring-ppx-accent-soft rounded-ppx-selection duration-ppx-fast ease-ppx h-4 w-4 cursor-pointer appearance-none border transition-colors focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      :checked="props.checked"
      :disabled="props.disabled"
      :aria-label="accessibleLabel"
    />
    <Check
      v-if="props.checked && !props.indeterminate"
      aria-hidden="true"
      class="text-ppx-bg-elevated pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 peer-disabled:opacity-50"
    />
    <Minus
      v-else-if="props.indeterminate"
      aria-hidden="true"
      class="text-ppx-bg-elevated pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 peer-disabled:opacity-50"
    />
  </span>
</template>
