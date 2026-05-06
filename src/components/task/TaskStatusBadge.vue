<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { DataProcessTaskStatus } from '@/types/api'

const props = defineProps<{
  status: DataProcessTaskStatus
}>()

const { t } = useI18n()
const colorClass = computed(() => {
  switch (props.status) {
    case 'RUNNING':
    case 'CANCELING':
      return 'workspace-badge--warning'
    case 'COMPLETED':
      return 'workspace-badge--success'
    case 'FAILED':
      return 'workspace-badge--danger'
    case 'CANCELED':
      return 'workspace-badge--neutral'
    default:
      return 'workspace-badge--info'
  }
})

const label = computed(() => t(`tasks.status.${props.status}`))
</script>

<template>
  <span class="workspace-badge" :class="colorClass">
    {{ label }}
  </span>
</template>
