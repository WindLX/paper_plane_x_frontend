<script setup lang="ts">
import { PanelsTopLeft, FileText } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import ProjectFileBrowser from '@/components/project/ProjectFileBrowser.vue'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  toggleDrawer: []
  openDrawer: [paperId?: string]
}>()

const { t } = useI18n()

function handlePaperClick(paperId: string): void {
  emit('openDrawer', paperId)
}

function handleToggleDrawer(): void {
  emit('toggleDrawer')
}
</script>

<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <!-- Toolbar -->
    <div class="border-ppx-border flex items-center justify-between gap-2 border-b px-4 py-2">
      <div class="flex items-center gap-2">
        <FileText class="text-ppx-text-muted h-4 w-4" />
        <span class="text-ppx-text text-sm font-semibold">{{ t('projects.projectFiles') }}</span>
      </div>
      <AppButton size="xs" @click="handleToggleDrawer">
        <PanelsTopLeft class="h-4 w-4" />
      </AppButton>
    </div>

    <!-- File browser -->
    <div class="min-h-0 flex-1 overflow-hidden p-4">
      <ProjectFileBrowser
        :key="props.projectId"
        :project-id="props.projectId"
        @paper-click="handlePaperClick"
      />
    </div>
  </section>
</template>
