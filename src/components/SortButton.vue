<script setup lang="ts">
import {
    ArrowDownUp,
    ArrowDownNarrowWide,
    ArrowUpNarrowWide,
} from 'lucide-vue-next'

import type { SortOrder } from '../types/sort'

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
    <button type="button"
        class="inline-flex cursor-pointer items-center gap-1 bg-transparent p-0 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
        @click="emit('click')">
        <span>{{ label }}</span>
        <ArrowUpNarrowWide v-if="props.active && props.order === 'asc'" class="h-3.5 w-3.5" />
        <ArrowDownNarrowWide v-else-if="props.active && props.order === 'desc'" class="h-3.5 w-3.5" />
        <ArrowDownUp v-else class="h-3.5 w-3.5 opacity-40" />
    </button>
</template>
