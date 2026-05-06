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
const {
  projects,
  loading,
  activeProjectId,
  createModalOpen,
  searchModalOpen,
  projectKeyword,
  submitting,
  openCreateModal,
  openSearchModal,
  handleCreate,
  openProject,
} = useProjectSidebarController()

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
        :projects="projects"
        :active-project-id="activeProjectId"
        :collapsed="props.collapsed"
        :loading="loading"
        @open-project="openProject"
        @open-create-modal="openCreateModal"
        @open-search-modal="openSearchModal"
      />

      <SidebarNav :collapsed="props.collapsed" />
    </div>

    <SidebarProjectCreateForm
      :open="createModalOpen"
      :submitting="submitting"
      @close="createModalOpen = false"
      @submit="handleCreate"
    />

    <SidebarProjectSearchModal
      v-model:keyword="projectKeyword"
      :open="searchModalOpen"
      :projects="projects"
      @update:keyword="projectKeyword = $event"
      @close="searchModalOpen = false"
      @create-project="((createModalOpen = true), (searchModalOpen = false))"
      @open-project="openProject"
    />
  </aside>
</template>
