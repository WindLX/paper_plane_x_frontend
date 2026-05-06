import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useNotify } from '@/composables/useNotify'
import { useProjectStore } from '@/stores/projects'

export function useProjectSidebarController() {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const notify = useNotify()
  const projectStore = useProjectStore()

  const createModalOpen = ref(false)
  const searchModalOpen = ref(false)
  const projectKeyword = ref('')
  const submitting = ref(false)
  const projects = computed(() => projectStore.projects)
  const loading = computed(() => projectStore.listLoading)
  const error = computed(() => projectStore.error)

  const activeProjectId = computed(() => {
    const routeProjectId =
      typeof route.params.projectId === 'string' ? route.params.projectId : null
    return route.name === 'ProjectPage' ? routeProjectId : null
  })

  async function ensureProjects(): Promise<void> {
    if (projectStore.projects.length === 0 && !projectStore.listLoading) {
      await projectStore.fetchProjects()
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
    submitting.value = true
    const project = await projectStore.createProject(name, description)
    if (project) {
      createModalOpen.value = false
      notify.push(t('sidebar.project.created'), 'success')
      await router.push(`/projects/${project.project_id}`)
    }
    submitting.value = false
  }

  async function openProject(projectId: string): Promise<void> {
    await router.push(`/projects/${projectId}`)
    searchModalOpen.value = false
  }

  onMounted(() => {
    void ensureProjects()
  })

  return {
    projects,
    loading,
    error,
    activeProjectId,
    createModalOpen,
    searchModalOpen,
    projectKeyword,
    submitting,
    openCreateModal,
    openSearchModal,
    handleCreate,
    openProject,
  }
}
