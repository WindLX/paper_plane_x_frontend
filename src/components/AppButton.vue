<script setup lang="ts">
import { computed } from 'vue'

type ButtonTone = 'neutral' | 'sky' | 'amber' | 'rose' | 'emerald'
type ButtonVariant = 'soft' | 'outline' | 'solid'
type ButtonSize = 'xs' | 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    tone?: ButtonTone
    variant?: ButtonVariant
    size?: ButtonSize
    disabled?: boolean
    block?: boolean
    title?: string
    loading?: boolean
    iconOnly?: boolean
    emphasis?: 'default' | 'strong'
  }>(),
  {
    type: 'button',
    tone: 'neutral',
    variant: 'soft',
    size: 'sm',
    disabled: false,
    block: false,
    title: undefined,
    loading: false,
    iconOnly: false,
    emphasis: 'default',
  },
)

const baseClass =
  'inline-flex items-center justify-center gap-1.5 border font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none'

const sizeClass = computed(() => {
  if (props.iconOnly) {
    if (props.size === 'xs') return 'h-8 w-8 p-0 text-xs'
    if (props.size === 'md') return 'h-11 w-11 p-0 text-sm'
    return 'h-9 w-9 p-0 text-sm'
  }
  if (props.size === 'xs') return 'px-2.5 py-1.5 text-xs'
  if (props.size === 'md') return 'px-3.5 py-2.5 text-sm'
  return 'px-3 py-2 text-sm'
})

const shapeClass = computed(() => 'rounded-ppx-interactive')

const emphasisClass = computed(() =>
  props.emphasis === 'strong' ? 'shadow-ppx-shadow-raised' : 'shadow-ppx-shadow-rest',
)

const toneClass = computed(() => {
  const tone = props.tone
  const variant = props.variant

  if (variant === 'solid') {
    if (tone === 'sky')
      return 'border-transparent bg-ppx-accent text-ppx-bg-elevated hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
    if (tone === 'amber')
      return 'border-transparent bg-ppx-warning text-ppx-text hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ppx-warning-soft'
    if (tone === 'rose')
      return 'border-transparent bg-ppx-danger text-ppx-bg-elevated hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ppx-danger-soft'
    if (tone === 'emerald')
      return 'border-transparent bg-ppx-success text-ppx-text hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ppx-success-soft'
    return 'border-transparent bg-ppx-text text-ppx-bg-elevated hover:opacity-92 focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
  }

  if (variant === 'outline') {
    if (tone === 'sky')
      return 'border-ppx-border-strong bg-transparent text-ppx-accent hover:bg-ppx-accent-soft focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
    if (tone === 'amber')
      return 'border-ppx-border-strong bg-transparent text-ppx-warning hover:bg-ppx-warning-soft focus-visible:ring-3 focus-visible:ring-ppx-warning-soft'
    if (tone === 'rose')
      return 'border-ppx-border-strong bg-transparent text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-3 focus-visible:ring-ppx-danger-soft'
    if (tone === 'emerald')
      return 'border-ppx-border-strong bg-transparent text-ppx-success hover:bg-ppx-success-soft focus-visible:ring-3 focus-visible:ring-ppx-success-soft'
    return 'border-ppx-border bg-transparent text-ppx-text-soft hover:bg-ppx-bg-subtle hover:text-ppx-text focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
  }

  if (tone === 'sky')
    return 'border-[color:color-mix(in_srgb,var(--ppx-accent)_18%,transparent)] bg-ppx-accent-soft text-ppx-accent hover:brightness-98 focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
  if (tone === 'amber')
    return 'border-[color:color-mix(in_srgb,var(--ppx-warning)_18%,transparent)] bg-ppx-warning-soft text-ppx-warning hover:brightness-98 focus-visible:ring-3 focus-visible:ring-ppx-warning-soft'
  if (tone === 'rose')
    return 'border-[color:color-mix(in_srgb,var(--ppx-danger)_18%,transparent)] bg-ppx-danger-soft text-ppx-danger hover:brightness-98 focus-visible:ring-3 focus-visible:ring-ppx-danger-soft'
  if (tone === 'emerald')
    return 'border-[color:color-mix(in_srgb,var(--ppx-success)_18%,transparent)] bg-ppx-success-soft text-ppx-success hover:brightness-98 focus-visible:ring-3 focus-visible:ring-ppx-success-soft'
  return 'border-ppx-border bg-ppx-bg-subtle text-ppx-text-soft hover:bg-ppx-bg-inset hover:text-ppx-text focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :title="props.title"
    :aria-busy="props.loading"
    :class="[
      baseClass,
      sizeClass,
      shapeClass,
      toneClass,
      emphasisClass,
      'whitespace-nowrap',
      props.block ? 'w-full' : '',
    ]"
  >
    <span
      v-if="props.loading"
      class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
    <slot />
  </button>
</template>
