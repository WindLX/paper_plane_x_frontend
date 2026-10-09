import { computed, reactive, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import { useNotify } from '@/composables/useNotify'
import { useProjectExports } from '@/composables/useProjectExports'
import { useProjectOverview } from '@/composables/useProjectOverview'
import { useProjectStore } from '@/stores/projects'
import type { ProjectExportRequest } from '@/types/api'

export type ProjectPageTab = 'overview' | 'papers' | 'files' | 'activity'

export const PROJECT_PAGE_TABS: ProjectPageTab[] = ['overview', 'papers', 'files', 'activity']

function isProjectPageTab(value: unknown): value is ProjectPageTab {
  return typeof value === 'string' && (PROJECT_PAGE_TABS as string[]).includes(value)
}

export type ActivityDrawerKind = 'task' | 'trace' | 'paper'

export function useProjectPageController(projectId: Ref<string>) {
  const router = useRouter()
  const { t } = useI18n()
  const notify = useNotify()
  const projectStore = useProjectStore()

  const loading = ref(false)
  const deleteConfirmOpen = ref(false)
  const summaryUpdating = ref(false)
  const summaryError = ref<string | null>(null)
  let projectRequest = 0
  let summaryRequest = 0
  const activeTab = ref<ProjectPageTab>('overview')
  const fileDrawerOpen = ref(false)
  const fileDrawerPaperId = ref<string | null>(null)
  const paperDrawerOpen = ref(false)
  const paperDrawerPaperId = ref<string | null>(null)
  const activityDrawerKind = ref<ActivityDrawerKind | null>(null)
  const activityDrawerId = ref<string | null>(null)

  const overview = useProjectOverview(projectId)
  const exports = useProjectExports(projectId)

  const project = computed(() => projectStore.currentProject)
  const pageTitle = computed(() => project.value?.name ?? projectId.value)
  const pageSubtitle = computed(() => project.value?.description ?? '')

  // ── Query-string deep links ───────────────────────────────────────────────
  const routeFilePath = computed(() => {
    const raw = router.currentRoute.value.query.file_path
    return typeof raw === 'string' && raw ? raw : null
  })
  const routePaperId = computed(() => {
    const raw = router.currentRoute.value.query.paper_id
    return typeof raw === 'string' && raw ? raw : null
  })

  function updateQuery(patch: Record<string, string | undefined>, replace = false): void {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(router.currentRoute.value.query)) {
      if (typeof value === 'string') query[key] = value
    }
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        delete query[key]
      } else {
        query[key] = value
      }
    }
    const navigate = replace ? router.replace : router.push
    void navigate({ query })
  }

  function setActiveTab(tab: ProjectPageTab): void {
    const returningToOverview = tab === 'overview' && activeTab.value !== tab
    activeTab.value = tab
    if (returningToOverview) void overview.load()
    if (tab !== 'files') closeFileDrawer()
    if (tab !== 'papers') closePaperDrawer()
    if (tab !== 'activity') closeActivityDrawer()
  }

  function openTab(tab: ProjectPageTab): void {
    setActiveTab(tab)
    updateQuery({
      tab,
      ...(tab === 'papers' ? {} : { paper_id: undefined }),
      ...(tab === 'files' ? {} : { file_path: undefined }),
      ...(tab === 'activity' ? {} : { activity_id: undefined }),
    })
  }

  function openFileDeepLink(filePath: string): void {
    activeTab.value = 'files'
    closeActivityDrawer()
    closePaperDrawer()
    updateQuery({ tab: 'files', file_path: filePath })
  }

  function openActivityDeepLink(activityId: string): void {
    setActiveTab('activity')
    updateQuery({
      tab: 'activity',
      activity_id: activityId,
      file_path: undefined,
      paper_id: undefined,
    })
  }

  const routeActivityId = computed(() => {
    const raw = router.currentRoute.value.query.activity_id
    return typeof raw === 'string' && raw ? raw : null
  })

  // Reset per-project view state before the deep-link watchers below run, so a
  // paper/file query parameter is not immediately cleared on the first render.
  watch(
    projectId,
    () => {
      summaryRequest++
      summaryUpdating.value = false
      summaryError.value = null
      closeFileDrawer()
      closePaperDrawer()
      closeActivityDrawer()
      void loadData()
    },
    { immediate: true },
  )

  watch(
    () => router.currentRoute.value.query.tab,
    (raw) => {
      const tab = isProjectPageTab(raw) ? raw : 'overview'
      if (tab !== activeTab.value) setActiveTab(tab)
    },
    { immediate: true },
  )

  watch(
    routePaperId,
    (paperId) => {
      if (paperId) {
        activeTab.value = 'papers'
        paperDrawerPaperId.value = paperId
        paperDrawerOpen.value = true
      } else if (paperDrawerOpen.value) {
        paperDrawerOpen.value = false
        paperDrawerPaperId.value = null
      }
    },
    { immediate: true },
  )

  // ── Data loading ─────────────────────────────────────────────────────────
  async function loadData(): Promise<void> {
    if (!projectId.value) return
    loading.value = true
    const request = ++projectRequest
    projectStore.selectProject(projectId.value)
    try {
      await Promise.all([projectStore.fetchProject(projectId.value), overview.load()])
    } catch (error) {
      if (request === projectRequest)
        notify.push(
          error instanceof Error ? error.message : t('projects.errors.requestFailed'),
          'error',
          3600,
        )
    } finally {
      if (request === projectRequest) loading.value = false
    }
  }

  async function updateAgentSummary(content: string): Promise<void> {
    const pid = projectId.value
    const request = ++summaryRequest
    summaryUpdating.value = true
    summaryError.value = null
    try {
      const nextProject = await api.setProjectAgentSummary(pid, content)
      if (pid !== projectId.value || request !== summaryRequest) return
      projectStore.syncProject(nextProject)
      overview.patchAgentSummary(nextProject.agent_summary)
      notify.push(t('projects.agentSummaryUpdated'), 'success', 2000)
    } catch (error) {
      if (pid !== projectId.value || request !== summaryRequest) return
      summaryError.value = error instanceof Error ? error.message : t('workbench.summary.failed')
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    } finally {
      if (pid === projectId.value && request === summaryRequest) summaryUpdating.value = false
    }
  }

  async function deleteAgentSummary(): Promise<void> {
    const pid = projectId.value
    const request = ++summaryRequest
    summaryUpdating.value = true
    summaryError.value = null
    try {
      const nextProject = await api.deleteProjectAgentSummary(pid)
      if (pid !== projectId.value || request !== summaryRequest) return
      projectStore.syncProject(nextProject)
      overview.patchAgentSummary(null)
      notify.push(t('projects.agentSummaryDeleted'), 'success', 2000)
    } catch (error) {
      if (pid !== projectId.value || request !== summaryRequest) return
      summaryError.value = error instanceof Error ? error.message : t('workbench.summary.failed')
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    } finally {
      if (pid === projectId.value && request === summaryRequest) summaryUpdating.value = false
    }
  }

  async function forceAgentSummary(): Promise<void> {
    const pid = projectId.value
    const request = ++summaryRequest
    summaryUpdating.value = true
    summaryError.value = null
    try {
      const result = await api.librarianForceAgentSummary(pid)
      if (pid !== projectId.value || request !== summaryRequest) return
      if (!result.agent_summary) {
        summaryError.value = t('workbench.summary.failed')
        return
      }
      if (project.value) {
        projectStore.patchProject(pid, {
          agent_summary: result.agent_summary,
        })
      }
      overview.patchAgentSummary(result.agent_summary)
      notify.push(t('projects.agentSummaryUpdated'), 'success', 2000)
    } catch (error) {
      if (pid !== projectId.value || request !== summaryRequest) return
      summaryError.value = error instanceof Error ? error.message : t('workbench.summary.failed')
      notify.push(
        error instanceof Error ? error.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    } finally {
      if (pid === projectId.value && request === summaryRequest) summaryUpdating.value = false
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

  function exportProject(payload: ProjectExportRequest): void {
    void exports.start(payload)
  }

  // ── Drawers ──────────────────────────────────────────────────────────────
  const drawerOpen = computed(() => {
    if (activeTab.value === 'files') return fileDrawerOpen.value
    if (activeTab.value === 'papers') return paperDrawerOpen.value
    if (activeTab.value === 'activity') return activityDrawerKind.value !== null
    return false
  })

  function closeDrawer(): void {
    if (activeTab.value === 'files') closeFileDrawer()
    else if (activeTab.value === 'papers') closePaperDrawer()
    else if (activeTab.value === 'activity') closeActivityDrawer()
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

  function openPaperDrawer(paperId?: string): void {
    if (paperId) {
      paperDrawerPaperId.value = paperId
    }
    paperDrawerOpen.value = true
    activeTab.value = 'papers'
    closeFileDrawer()
    closeActivityDrawer()
    updateQuery({ tab: 'papers', paper_id: paperDrawerPaperId.value ?? undefined }, true)
  }

  function closePaperDrawer(): void {
    paperDrawerOpen.value = false
    paperDrawerPaperId.value = null
    if (routePaperId.value) updateQuery({ paper_id: undefined }, true)
  }

  function togglePaperDrawer(): void {
    if (paperDrawerOpen.value) {
      closePaperDrawer()
    } else {
      openPaperDrawer()
    }
  }

  function openActivityDrawer(kind: ActivityDrawerKind, id: string): void {
    activityDrawerKind.value = kind
    activityDrawerId.value = id
  }

  function openActivityTask(taskId: string): void {
    openActivityDrawer('task', taskId)
  }

  function openActivityTrace(traceId: string): void {
    openActivityDrawer('trace', traceId)
  }

  function openActivityPaper(paperId: string): void {
    openActivityDrawer('paper', paperId)
  }

  function closeActivityDrawer(): void {
    activityDrawerKind.value = null
    activityDrawerId.value = null
  }

  return reactive({
    loading,
    summaryUpdating,
    summaryError,
    project,
    pageTitle,
    pageSubtitle,
    deleteConfirmOpen,
    activeTab,
    drawerOpen,
    fileDrawerOpen,
    fileDrawerPaperId,
    paperDrawerOpen,
    paperDrawerPaperId,
    activityDrawerKind,
    activityDrawerId,
    routeFilePath,
    routePaperId,
    overview,
    exports,
    loadData,
    updateAgentSummary,
    deleteAgentSummary,
    forceAgentSummary,
    updateProject,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteProject,
    exportProject,
    openTab,
    openFileDeepLink,
    openActivityDeepLink,
    routeActivityId,
    closeDrawer,
    openFileDrawer,
    closeFileDrawer,
    openPaperDrawer,
    closePaperDrawer,
    togglePaperDrawer,
    openActivityTask,
    openActivityTrace,
    openActivityPaper,
    closeActivityDrawer,
  })
}
