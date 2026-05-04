<script setup lang="ts">
import { ArrowDownUp, ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-vue-next'

import type { SortOrder } from '@/types/sort'

const props = defineProps<{
  label: string
  active: boolean
  order: SortOrder
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="text-ppx-text-muted hover:text-ppx-text inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 text-sm font-semibold tracking-tight uppercase transition-colors"
    @click="emit('click')"
  >
    <span :class="props.active ? 'text-ppx-text' : ''">{{ label }}</span>
    <ArrowUpNarrowWide
      v-if="props.active && props.order === 'asc'"
      class="text-ppx-text h-3.5 w-3.5"
    />
    <ArrowDownNarrowWide
      v-else-if="props.active && props.order === 'desc'"
      class="text-ppx-text h-3.5 w-3.5"
    />
    <ArrowDownUp v-else class="h-3.5 w-3.5 opacity-40" />
  </button>
</template>
