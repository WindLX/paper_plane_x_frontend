import { computed, reactive, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import { useConversationDrawer } from '@/composables/useConversationDrawer'
import { useNotify } from '@/composables/useNotify'
import { useProjectConversationsController } from '@/composables/useProjectConversationsController'
import { useProjectStore } from '@/stores/projects'
import type { LibrarianGlobalFinderResponse, ProjectExportField } from '@/types/api'

export type ProjectPageTab = 'conversations' | 'files' | 'papers'

export function useProjectPageController(projectId: Ref<string>) {
  const router = useRouter()
  const { t } = useI18n()
  const notify = useNotify()
  const projectStore = useProjectStore()

  const conversationDrawer = useConversationDrawer()
  const conversations = useProjectConversationsController(projectId)

  const loading = ref(false)
  const globalFinder = ref<LibrarianGlobalFinderResponse | null>(null)
  const deleteConfirmOpen = ref(false)
  const activeTab = ref<ProjectPageTab>('conversations')
  const fileDrawerOpen = ref(false)
  const fileDrawerPaperId = ref<string | null>(null)
  const paperDrawerOpen = ref(false)
  const paperDrawerPaperId = ref<string | null>(null)

  const project = computed(() => projectStore.currentProject)
  const pageTitle = computed(() => project.value?.name ?? projectId.value)
  const pageSubtitle = computed(() => project.value?.description ?? '')
  const hasCurrentConversation = computed(() => conversations.activeConversationId !== null)

  async function loadGlobalFinder(): Promise<void> {
    globalFinder.value = await api.librarianGlobalFinder(projectId.value)
  }

  async function loadData(): Promise<void> {
    if (!projectId.value) return
    loading.value = true
    projectStore.selectProject(projectId.value)
    try {
      await Promise.all([projectStore.fetchProject(projectId.value), loadGlobalFinder()])
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  async function handleCreateConversation(): Promise<void> {
    await conversations.createConversation()
  }

  async function updateAgentSummary(content: string): Promise<void> {
    try {
      const nextProject = await api.setProjectAgentSummary(projectId.value, content)
      projectStore.syncProject(nextProject)
      if (globalFinder.value) {
        globalFinder.value.agent_summary = nextProject.agent_summary
      }
      notify.push(t('projects.agentSummaryUpdated'), 'success', 2000)
    } catch (error) {
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function deleteAgentSummary(): Promise<void> {
    try {
      const nextProject = await api.deleteProjectAgentSummary(projectId.value)
      projectStore.syncProject(nextProject)
      if (globalFinder.value) {
        globalFinder.value.agent_summary = null
      }
      notify.push(t('projects.agentSummaryDeleted'), 'success', 2000)
    } catch (error) {
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function forceAgentSummary(): Promise<void> {
    try {
      const result = await api.librarianForceAgentSummary(projectId.value)
      if (project.value) {
        projectStore.patchProject(projectId.value, {
          agent_summary: result.agent_summary,
        })
      }
      if (globalFinder.value) {
        globalFinder.value.agent_summary = result.agent_summary
      }
      notify.push(t('projects.agentSummaryUpdated'), 'success', 2000)
    } catch (error) {
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function updateProject(payload: {
    name?: string | null
    description?: string | null
  }): Promise<void> {
    const nextProject = await projectStore.updateProject(projectId.value, payload)
    if (nextProject) {
      notify.push(t('projects.projectUpdated'), 'success', 2000)
    } else if (projectStore.error) {
      notify.push(projectStore.error, 'error', 3600)
    }
  }

  function openDeleteConfirm(): void {
    deleteConfirmOpen.value = true
  }

  function closeDeleteConfirm(): void {
    deleteConfirmOpen.value = false
  }

  async function confirmDeleteProject(): Promise<void> {
    closeDeleteConfirm()
    const success = await projectStore.deleteProject(projectId.value)
    if (!success) {
      if (projectStore.error) {
        notify.push(projectStore.error, 'error', 3600)
      }
      return
    }

    notify.push(t('projects.projectDeleted'), 'success', 2000)
    await router.push('/')
  }

  async function exportProject(payload: {
    fields: ProjectExportField[]
    citationsMode: 'keep' | 'strip'
  }): Promise<void> {
    try {
      const blob = await api.exportProject(projectId.value, {
        fields: payload.fields,
        citations_mode: payload.citationsMode,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${projectId.value}_export.zip`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      notify.push(t('projects.exportReady'), 'success', 2000)
    } catch (error) {
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  const drawerOpen = computed(() => {
    if (activeTab.value === 'conversations') return conversationDrawer.drawerOpen
    if (activeTab.value === 'files') return fileDrawerOpen.value
    if (activeTab.value === 'papers') return paperDrawerOpen.value
    return false
  })

  function closeDrawer(): void {
    if (activeTab.value === 'conversations') {
      conversationDrawer.closeDrawer()
    } else if (activeTab.value === 'files') {
      closeFileDrawer()
    } else if (activeTab.value === 'papers') {
      closePaperDrawer()
    }
  }

  function openFileDrawer(paperId?: string): void {
    if (paperId) {
      fileDrawerPaperId.value = paperId
    }
    fileDrawerOpen.value = true
  }

  function closeFileDrawer(): void {
    fileDrawerOpen.value = false
    fileDrawerPaperId.value = null
  }

  function toggleFileDrawer(): void {
    if (fileDrawerOpen.value) {
      closeFileDrawer()
    } else {
      openFileDrawer()
    }
  }

  function openPaperDrawer(paperId?: string): void {
    if (paperId) {
      paperDrawerPaperId.value = paperId
    }
    paperDrawerOpen.value = true
  }

  function closePaperDrawer(): void {
    paperDrawerOpen.value = false
    paperDrawerPaperId.value = null
  }

  function togglePaperDrawer(): void {
    if (paperDrawerOpen.value) {
      closePaperDrawer()
    } else {
      openPaperDrawer()
    }
  }

  function openTab(tab: ProjectPageTab): void {
    activeTab.value = tab
  }

  watch(
    projectId,
    () => {
      conversationDrawer.closeDrawer()
      closeFileDrawer()
      closePaperDrawer()
      void loadData()
    },
    { immediate: true },
  )

  watch(activeTab, () => {
    conversationDrawer.closeDrawer()
    closeFileDrawer()
    closePaperDrawer()
  })

  return reactive({
    loading,
    project,
    globalFinder,
    pageTitle,
    pageSubtitle,
    deleteConfirmOpen,
    activeTab,
    drawerOpen,
    fileDrawerOpen,
    fileDrawerPaperId,
    paperDrawerOpen,
    paperDrawerPaperId,
    hasCurrentConversation,
    conversationDrawer,
    conversations,
    loadData,
    handleCreateConversation,
    updateAgentSummary,
    deleteAgentSummary,
    forceAgentSummary,
    updateProject,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteProject,
    exportProject,
    openTab,
    closeDrawer,
    openFileDrawer,
    closeFileDrawer,
    toggleFileDrawer,
    openPaperDrawer,
    closePaperDrawer,
    togglePaperDrawer,
  })
}
