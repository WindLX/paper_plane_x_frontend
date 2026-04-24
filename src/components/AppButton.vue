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
  }>(),
  {
    type: 'button',
    tone: 'neutral',
    variant: 'soft',
    size: 'sm',
    disabled: false,
    block: false,
    title: undefined,
  },
)

const baseClass =
  'inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'px-2 py-1 text-xs'
  if (props.size === 'md') return 'px-3 py-2 text-sm'
  return 'px-2.5 py-1.5 text-sm'
})

const toneClass = computed(() => {
  const tone = props.tone
  const variant = props.variant

  if (variant === 'solid') {
    if (tone === 'sky') return 'border-sky-700 bg-sky-600 text-white hover:bg-sky-700 dark:border-sky-700'
    if (tone === 'amber') return 'border-amber-700 bg-amber-600 text-white hover:bg-amber-700 dark:border-amber-700'
    if (tone === 'rose') return 'border-rose-700 bg-rose-600 text-white hover:bg-rose-700 dark:border-rose-700'
    if (tone === 'emerald') return 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-700'
    return 'border-slate-700 bg-slate-600 text-white hover:bg-slate-700 dark:border-slate-500'
  }

  if (variant === 'outline') {
    if (tone === 'sky') return 'border-sky-300 bg-transparent text-sky-700 hover:bg-sky-50 disabled:hover:bg-transparent dark:border-sky-700 dark:text-sky-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-transparent'
    if (tone === 'amber') return 'border-amber-300 bg-transparent text-amber-700 hover:bg-amber-50 disabled:hover:bg-transparent dark:border-amber-700 dark:text-amber-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-transparent'
    if (tone === 'rose') return 'border-rose-300 bg-transparent text-rose-700 hover:bg-rose-50 disabled:hover:bg-transparent dark:border-rose-700 dark:text-rose-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-transparent'
    if (tone === 'emerald') return 'border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-50 disabled:hover:bg-transparent dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-transparent'
    return 'border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 disabled:hover:bg-transparent dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:hover:bg-transparent'
  }

  if (tone === 'sky') return 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:hover:bg-sky-50 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-sky-900/20'
  if (tone === 'amber') return 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-amber-900/20'
  if (tone === 'rose') return 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:hover:bg-rose-50 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-rose-900/20'
  if (tone === 'emerald') return 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-slate-800 dark:disabled:hover:bg-emerald-900/20'
  return 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800'
})
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" :title="props.title"
    :class="[baseClass, sizeClass, toneClass, props.block ? 'w-full' : '']">
    <slot />
  </button>
</template>
