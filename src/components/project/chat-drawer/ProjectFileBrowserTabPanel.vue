<script setup lang="ts">
import ProjectFileBrowser from '@/components/project/ProjectFileBrowser.vue'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  openPaper: [paperId: string]
}>()

function handlePaperClick(paperId: string): void {
  emit('openPaper', paperId)
}
</script>

<template>
  <ProjectFileBrowser :project-id="props.projectId" @paper-click="handlePaperClick" />
</template>
