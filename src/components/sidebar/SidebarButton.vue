<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** 'action' = icon+text button, 'toggle' = section header, 'item' = selectable list item */
    variant?: 'action' | 'toggle' | 'item'
    active?: boolean
    collapsed?: boolean
    /** Show a ChevronDown icon on the right side (for toggle variant) */
    open?: boolean
  }>(),
  {
    variant: 'action',
    active: false,
    collapsed: false,
    open: false,
  },
)

const rootClass = computed(() => {
  const base =
    'group duration-ppx-fast w-full cursor-pointer rounded-xl text-left text-sm font-medium transition-colors'

  if (props.variant === 'toggle') {
    return `${base} text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-8 items-center justify-between px-2 font-semibold`
  }

  if (props.variant === 'item') {
    const state = props.active
      ? 'bg-ppx-bg-elevated text-ppx-text shadow-ppx-rest'
      : 'text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text'
    return `${base} flex h-9 min-w-0 items-center gap-2.5 px-2 ${props.collapsed ? 'justify-center' : ''} ${state}`
  }

  // action
  return `${base} text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-9 items-center gap-2.5 px-2 ${props.collapsed ? 'justify-center' : ''}`
})
</script>

<template>
  <button type="button" :class="rootClass">
    <slot name="icon" />
    <span v-if="!collapsed" class="min-w-0 flex-1 truncate">
      <slot />
    </span>
    <span v-if="variant === 'toggle' && !collapsed" class="shrink-0">
      <ChevronDown
        class="text-ppx-text-soft duration-ppx-fast h-4 w-4 transition-transform"
        :class="open ? '' : '-rotate-90'"
      />
    </span>
    <slot name="after" />
  </button>
</template>
