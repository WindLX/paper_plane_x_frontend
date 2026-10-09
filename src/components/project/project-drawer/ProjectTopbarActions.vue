<script setup lang="ts">
import type { Component } from 'vue'
import {
  Download,
  EllipsisVertical,
  Folder,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useI18n } from 'vue-i18n'

import ProjectTopbarButton from './ProjectTopbarButton.vue'
import type { ProjectPageTab } from '@/composables/useProjectPageController'

const props = defineProps<{
  activePanel: string | null
  activeTab: ProjectPageTab
}>()

const emit = defineEmits<{
  openPanel: [name: 'export' | 'edit']
  openTab: [tab: ProjectPageTab]
  deleteProject: []
}>()

const { t } = useI18n()

const tabButtons: { key: ProjectPageTab; icon: Component; label: string }[] = [
  { key: 'overview', icon: LayoutDashboard, label: t('workbench.tabs.overview') },
  { key: 'papers', icon: LibraryBig, label: t('workbench.tabs.papers') },
  { key: 'files', icon: Folder, label: t('workbench.tabs.files') },
  { key: 'activity', icon: ListChecks, label: t('workbench.tabs.activity') },
]

const menuItemClass =
  'flex cursor-pointer items-center gap-2 rounded-ppx-interactive px-2.5 py-1.5 text-ppx-text-soft outline-none select-none data-[highlighted]:bg-ppx-bg-subtle data-[highlighted]:text-ppx-text'
</script>

<template>
  <div class="flex shrink-0 flex-nowrap items-center gap-1.5">
    <ProjectTopbarButton
      v-for="tab in tabButtons"
      :key="tab.key"
      :icon="tab.icon"
      :label="tab.label"
      :active="props.activeTab === tab.key"
      @click="emit('openTab', tab.key)"
    />

    <div class="bg-ppx-border h-5 w-px" />

    <ProjectTopbarButton
      :icon="Download"
      :label="t('projects.export')"
      :active="props.activePanel === 'export'"
      @click="emit('openPanel', 'export')"
    />

    <DropdownMenuRoot>
      <DropdownMenuTrigger as-child>
        <ProjectTopbarButton
          :icon="EllipsisVertical"
          :label="t('workbench.more.label')"
          :active="props.activePanel === 'edit'"
        />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          :side-offset="6"
          class="bg-ppx-bg-elevated border-ppx-border rounded-ppx-panel shadow-ppx-raised z-60 min-w-44 border p-1 text-sm"
        >
          <DropdownMenuItem :class="menuItemClass" @select="emit('openPanel', 'edit')">
            <Pencil class="h-3.5 w-3.5 shrink-0" />
            <span>{{ t('projects.edit') }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator class="bg-ppx-border my-1 h-px" />
          <DropdownMenuItem
            :class="menuItemClass + ' text-ppx-danger data-[highlighted]:text-ppx-danger'"
            @select="emit('deleteProject')"
          >
            <Trash2 class="h-3.5 w-3.5 shrink-0" />
            <span>{{ t('projects.delete') }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
