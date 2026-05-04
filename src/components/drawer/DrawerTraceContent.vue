<script setup lang="ts">
import TraceCard from '../trace/TraceCard.vue'
import type { AgentTraceResponse } from '@/types/api'

const props = defineProps<{
  trace: AgentTraceResponse
}>()

const emit = defineEmits<{
  delete: [traceId: string]
}>()
</script>

<template>
  <TraceCard :trace="props.trace" :default-open="true" @delete="emit('delete', $event)" />
</template>
