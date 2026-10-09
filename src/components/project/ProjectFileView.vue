<script setup lang="ts">
import { ref } from 'vue'

import ProjectFileBrowser from '@/components/project/ProjectFileBrowser.vue'

const props = defineProps<{
  projectId: string
  initialFilePath?: string | null
}>()

const emit = defineEmits<{
  openDrawer: [paperId?: string]
}>()

const browser = ref<InstanceType<typeof ProjectFileBrowser> | null>(null)
defineExpose({ ensureCanLeave: () => browser.value?.ensureCanLeave() ?? Promise.resolve(true) })

function handlePaperClick(paperId: string): void {
  emit('openDrawer', paperId)
}
</script>

<template>
  <section class="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
    <!-- File browser -->
    <div class="min-h-0 min-w-0 flex-1 overflow-hidden p-4">
      <ProjectFileBrowser
        ref="browser"
        :key="props.projectId"
        :project-id="props.projectId"
        :initial-file-path="props.initialFilePath ?? null"
        @paper-click="handlePaperClick"
      />
    </div>
  </section>
</template>
