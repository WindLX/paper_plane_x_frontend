<script setup lang="ts">
import { computed } from 'vue'

import type { DataProcessTaskStatus } from '../types/api'

const props = defineProps<{
  status: DataProcessTaskStatus
}>()

const colorClass = computed(() => {
  switch (props.status) {
    case 'RUNNING':
    case 'CANCELING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
    case 'FAILED':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
    case 'CANCELED':
      return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
    default:
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
  }
})
</script>

<template>
  <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="colorClass">
    {{ status }}
  </span>
</template>
