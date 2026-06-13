<script setup lang="ts">
import {
  LibraryBig,
  Download,
  Pencil,
  FileText,
  Trash2,
  Folder,
  MessageSquare,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'

import ProjectTopbarButton from './ProjectTopbarButton.vue'
import type { ProjectPageTab } from '@/composables/useProjectPageController'

const props = defineProps<{
  activePanel: string | null
  activeTab: ProjectPageTab
}>()

const emit = defineEmits<{
  openPanel: [name: string]
  openTab: [tab: ProjectPageTab]
  deleteProject: []
}>()

const { t } = useI18n()

const panelButtons = [
  { key: 'overview', icon: LibraryBig, label: t('projects.overview') },
  { key: 'export', icon: Download, label: t('projects.export') },
  { key: 'edit', icon: Pencil, label: t('projects.edit') },
  { key: 'logs', icon: FileText, label: t('projects.viewLogs') },
] as const

const tabButtons: { key: ProjectPageTab; icon: Component; label: string }[] = [
  { key: 'conversations', icon: MessageSquare, label: t('projects.chatSidebar.sidebarTitle') },
  { key: 'files', icon: Folder, label: t('projects.projectFiles') },
  { key: 'papers', icon: LibraryBig, label: t('projects.papers') },
]

function openTab(tab: ProjectPageTab): void {
  emit('openTab', tab)
}
</script>

<template>
  <div class="flex shrink-0 flex-nowrap items-center gap-1.5">
    <ProjectTopbarButton
      v-for="btn in panelButtons"
      :key="btn.key"
      :icon="btn.icon"
      :label="btn.label"
      :active="props.activePanel === btn.key"
      @click="emit('openPanel', btn.key)"
    />

    <div class="bg-ppx-border h-5 w-px" />

    <ProjectTopbarButton
      v-for="tab in tabButtons"
      :key="tab.key"
      :icon="tab.icon"
      :label="tab.label"
      :active="props.activeTab === tab.key"
      @click="openTab(tab.key)"
    />

    <div class="bg-ppx-border h-5 w-px" />

    <ProjectTopbarButton
      :icon="Trash2"
      :label="t('projects.delete')"
      tone="rose"
      @click="emit('deleteProject')"
    />
  </div>
</template>
