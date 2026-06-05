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

import AppButton from '@/components/AppButton.vue'
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
  <div class="flex items-center gap-1.5">
    <AppButton
      v-for="btn in panelButtons"
      :key="btn.key"
      size="xs"
      variant="outline"
      :class="props.activePanel === btn.key ? 'bg-ppx-bg-subtle ring-ppx-border-strong ring-1' : ''"
      @click="emit('openPanel', btn.key)"
    >
      <component :is="btn.icon" class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ btn.label }}</span>
    </AppButton>

    <div class="bg-ppx-border h-5 w-px" />

    <AppButton
      v-for="tab in tabButtons"
      :key="tab.key"
      size="xs"
      variant="outline"
      :class="props.activeTab === tab.key ? 'bg-ppx-bg-subtle ring-ppx-border-strong ring-1' : ''"
      @click="openTab(tab.key)"
    >
      <component :is="tab.icon" class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ tab.label }}</span>
    </AppButton>

    <div class="bg-ppx-border h-5 w-px" />

    <AppButton size="xs" variant="outline" tone="rose" @click="emit('deleteProject')">
      <Trash2 class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ t('projects.delete') }}</span>
    </AppButton>
  </div>
</template>
