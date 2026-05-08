<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

import { useProjectSidebarController } from '@/composables/useProjectSidebarController'

import SidebarHeader from './SidebarHeader.vue'
import SidebarNav from './SidebarNav.vue'
import SidebarProjectList from './SidebarProjectList.vue'
import SidebarProjectSearchModal from './SidebarProjectSearchModal.vue'
import SidebarProjectCreateForm from './SidebarProjectCreateForm.vue'

const props = withDefaults(
  defineProps<{
    collapsed?: boolean
  }>(),
  {
    collapsed: false,
  },
)

const uiStore = useUiStore()
const ctrl = useProjectSidebarController()

function toggleSidebar(): void {
  uiStore.toggleSidebar()
}
</script>

<template>
  <aside
    class="text-ppx-text-soft border-ppx-border flex h-full flex-col border-r px-2 py-3 backdrop-blur"
  >
    <SidebarHeader :collapsed="props.collapsed" @toggle-sidebar="toggleSidebar" />

    <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden px-1">
      <SidebarProjectList
        :projects="ctrl.projects"
        :active-project-id="ctrl.activeProjectId"
        :collapsed="props.collapsed"
        :loading="ctrl.loading"
        @open-project="ctrl.openProject"
        @open-create-modal="ctrl.openCreateModal"
        @open-search-modal="ctrl.openSearchModal"
      />

      <SidebarNav :collapsed="props.collapsed" />
    </div>

    <SidebarProjectCreateForm
      :open="ctrl.createModalOpen"
      :submitting="ctrl.submitting"
      @close="ctrl.createModalOpen = false"
      @submit="ctrl.handleCreate"
    />

    <SidebarProjectSearchModal
      v-model:keyword="ctrl.projectKeyword"
      :open="ctrl.searchModalOpen"
      :projects="ctrl.projects"
      @update:keyword="ctrl.projectKeyword = $event"
      @close="ctrl.searchModalOpen = false"
      @create-project="((ctrl.createModalOpen = true), (ctrl.searchModalOpen = false))"
      @open-project="ctrl.openProject"
    />
  </aside>
</template>
