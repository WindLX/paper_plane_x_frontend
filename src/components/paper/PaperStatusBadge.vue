<script setup lang="ts">
import { computed } from 'vue'

import type { ExtractionStatus, FactCheckStatus } from '@/types/api'

const props = defineProps<{
  status: ExtractionStatus | FactCheckStatus
}>()

const colorClass = computed(() => {
  switch (props.status) {
    case 'COMPLETED':
    case 'HUMAN_COMPLETED':
    case 'PASSED':
    case 'HUMAN_PASSED':
      return 'workspace-badge--success'
    case 'FAILED':
      return 'workspace-badge--danger'
    case 'PROCESSING':
      return 'workspace-badge--warning'
    case 'PENDING':
      return 'workspace-badge--info'
    default:
      return 'workspace-badge--info'
  }
})
</script>

<template>
  <span class="workspace-badge" :class="colorClass">
    {{ status }}
  </span>
</template>
