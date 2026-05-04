<script setup lang="ts">
import PaperDetailPanel from '@/components/paper/PaperDetailPanel.vue'
import type { PaperDetailResponse } from '@/types/api'

const props = defineProps<{
  paper: PaperDetailResponse
  projectId?: string
}>()

const emit = defineEmits<{
  link: [paperId: string]
  linkToProject: [projectId: string, paperId: string]
  unlink: [paperId: string]
}>()
</script>

<template>
  <PaperDetailPanel
    :paper="props.paper"
    :project-id="props.projectId"
    @link="emit('link', $event)"
    @link-to-project="emit('linkToProject', $event[0], $event[1])"
    @unlink="emit('unlink', $event)"
  />
</template>
