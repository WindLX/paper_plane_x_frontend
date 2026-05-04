<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import ProjectCreateForm from '@/components/project/ProjectCreateForm.vue'
import { useProjectStore } from '@/stores/projects'
import { useUiStore } from '@/stores/ui'
import SidebarHeader from './SidebarHeader.vue'
import SidebarNav from './SidebarNav.vue'
import SidebarProjectList from './SidebarProjectList.vue'
import SidebarProjectSearchModal from './SidebarProjectSearchModal.vue'
import AppModalShell from '../AppModalShell.vue'

const props = withDefaults(
  defineProps<{
    mobile?: boolean
    collapsed?: boolean
  }>(),
  {
    mobile: false,
    collapsed: false,
  },
)

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const uiStore = useUiStore()
const projectStore = useProjectStore()

const createModalOpen = ref(false)
const searchModalOpen = ref(false)
const projectKeyword = ref('')

const sortedProjects = computed(() =>
  [...projectStore.projects].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  ),
)

const activeProjectId = computed(() => {
  const match = route.path.match(/\/projects\/([^/]+)/)
  return match ? match[1] : null
})

function handleNavigate(): void {
  if (props.mobile) {
    emit('close')
  }
}

function toggleSidebar(): void {
  if (props.mobile) {
    emit('close')
    return
  }
  uiStore.toggleDesktopSidebar()
}

async function ensureProjects(): Promise<void> {
  if (projectStore.projects.length === 0 && !projectStore.loading) {
    await projectStore.fetchProjects({ offset: 0, limit: Math.max(projectStore.limit, 20) })
  }
}

async function openCreateModal(): Promise<void> {
  await ensureProjects()
  createModalOpen.value = true
}

async function openSearchModal(): Promise<void> {
  await ensureProjects()
  searchModalOpen.value = true
}

async function handleCreate(name: string, description: string | null): Promise<void> {
  await projectStore.createProject(name, description)
}

async function openProject(projectId: string): Promise<void> {
  await router.push(`/projects/${projectId}`)
  searchModalOpen.value = false
  handleNavigate()
}

onMounted(() => {
  void ensureProjects()
})
</script>

<template>
  <aside
    class="text-ppx-text-soft border-ppx-border flex h-full flex-col border-r px-2 py-3 backdrop-blur"
  >
    <SidebarHeader
      :mobile="props.mobile"
      :collapsed="props.collapsed"
      @close="emit('close')"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden px-1">
      <SidebarProjectList
        :projects="sortedProjects"
        :active-project-id="activeProjectId"
        :collapsed="props.collapsed"
        @open-project="openProject"
        @open-create-modal="openCreateModal"
        @open-search-modal="openSearchModal"
      />

      <SidebarNav :collapsed="props.collapsed" @navigate="handleNavigate" />
    </div>

    <AppModalShell
      :open="createModalOpen"
      :title="t('projects.createModalTitle')"
      width-class="max-w-2xl"
      @close="createModalOpen = false"
    >
      <ProjectCreateForm
        :on-create="
          async (name, description) => {
            await handleCreate(name, description)
            createModalOpen = false
          }
        "
      />
    </AppModalShell>

    <SidebarProjectSearchModal
      v-if="searchModalOpen"
      v-model:keyword="projectKeyword"
      :open="searchModalOpen"
      :projects="sortedProjects"
      @update:keyword="projectKeyword = $event"
      @close="searchModalOpen = false"
      @create-project="((createModalOpen = true), (searchModalOpen = false))"
      @open-project="openProject"
    />
  </aside>
</template>
