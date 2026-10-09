import { effectScope, nextTick, reactive, ref, type EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProjectPageController } from './useProjectPageController'
import type { ProjectOverviewResponse } from '@/types/api'

const mocks = vi.hoisted(() => {
  const routeRef: { value: { query: Record<string, string> } } = {
    value: { query: {} },
  }
  return {
    routeRef,
    push: vi.fn(async () => {}),
    replace: vi.fn(async () => {}),
    getProjectOverview: vi.fn(),
    fetchProject: vi.fn(async () => null),
    selectProject: vi.fn(),
    syncProject: vi.fn(),
    patchProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(async () => true),
    notify: vi.fn(),
    exports: {
      jobs: [],
      submitting: false,
      error: null,
      downloadingExportId: null,
      downloadProgress: null,
      load: vi.fn(),
      start: vi.fn(),
      cancel: vi.fn(),
      download: vi.fn(),
      stopDownload: vi.fn(),
    },
    setProjectAgentSummary: vi.fn(),
    deleteProjectAgentSummary: vi.fn(),
    librarianForceAgentSummary: vi.fn(),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ currentRoute: mocks.routeRef, push: mocks.push, replace: mocks.replace }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/i18n', () => ({ translate: (key: string) => key }))
vi.mock('./useNotify', () => ({ useNotify: () => ({ push: mocks.notify }) }))
vi.mock('./useProjectExports', () => ({ useProjectExports: () => mocks.exports }))
vi.mock('@/api', () => ({
  api: {
    getProjectOverview: mocks.getProjectOverview,
    setProjectAgentSummary: mocks.setProjectAgentSummary,
    deleteProjectAgentSummary: mocks.deleteProjectAgentSummary,
    librarianForceAgentSummary: mocks.librarianForceAgentSummary,
  },
}))
vi.mock('@/stores/projects', () => ({
  useProjectStore: () => ({
    currentProject: null,
    error: null,
    selectProject: mocks.selectProject,
    fetchProject: mocks.fetchProject,
    syncProject: mocks.syncProject,
    patchProject: mocks.patchProject,
    updateProject: mocks.updateProject,
    deleteProject: mocks.deleteProject,
  }),
}))

function overviewResponse(): ProjectOverviewResponse {
  return {
    project_id: 'project-one',
    agent_summary: null,
    stats: { paper_count: 0, parsed_count: 0, active_task_count: 0, attention_count: 0 },
    attention_items: [],
    recent_papers: [],
    recent_files: [],
    recent_activities: [],
    top_tags: [],
    year_distribution: {
      available_count: 0,
      missing_count: 0,
      mean: null,
      variance: null,
      median: null,
      mode_years: [],
      q25: null,
      q75: null,
      outlier_count: 0,
      low_outlier_count: 0,
      high_outlier_count: 0,
    },
    year_range: null,
    section_errors: {},
  }
}

const scopes: EffectScope[] = []

function setup(query: Record<string, string> = {}) {
  mocks.routeRef.value = reactive({ query: { ...query } })
  const scope = effectScope()
  scopes.push(scope)
  const projectId = ref('project-one')
  const ctrl = scope.run(() => useProjectPageController(projectId))!
  return { ctrl, projectId }
}

async function flush(): Promise<void> {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getProjectOverview.mockResolvedValue(overviewResponse())
})

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
})

describe('useProjectPageController navigation', () => {
  it('defaults to the overview tab and loads the overview', async () => {
    const { ctrl } = setup()
    expect(ctrl.activeTab).toBe('overview')
    await flush()
    expect(mocks.getProjectOverview).toHaveBeenCalledWith('project-one')
  })

  it('applies the tab query parameter on init', async () => {
    const { ctrl } = setup({ tab: 'activity' })
    expect(ctrl.activeTab).toBe('activity')
    await flush()
  })

  it('drops deep-link parameters when switching tabs', async () => {
    const { ctrl } = setup({ tab: 'files', file_path: '/notes/a.md' })
    await flush()
    mocks.push.mockClear()
    ctrl.openTab('papers')
    expect(ctrl.activeTab).toBe('papers')
    expect(mocks.push).toHaveBeenCalledWith({ query: { tab: 'papers' } })
  })

  it('follows browser back/forward route changes', async () => {
    const { ctrl } = setup()
    await flush()
    mocks.routeRef.value.query = { tab: 'files' }
    await nextTick()
    expect(ctrl.activeTab).toBe('files')
  })

  it('opens the paper drawer from a paper deep link', async () => {
    const { ctrl } = setup({ tab: 'papers', paper_id: 'pap-1' })
    await flush()
    expect(ctrl.activeTab).toBe('papers')
    expect(ctrl.paperDrawerPaperId).toBe('pap-1')
    expect(ctrl.drawerOpen).toBe(true)
  })

  it('opens the paper drawer and records the query', async () => {
    const { ctrl } = setup({ tab: 'overview' })
    await flush()
    mocks.replace.mockClear()
    ctrl.openPaperDrawer('pap-2')
    expect(ctrl.activeTab).toBe('papers')
    expect(ctrl.paperDrawerOpen).toBe(true)
    expect(mocks.replace).toHaveBeenCalledWith({ query: { tab: 'papers', paper_id: 'pap-2' } })
  })

  it('opens a file deep link on the files tab', async () => {
    const { ctrl } = setup({ tab: 'overview' })
    await flush()
    mocks.push.mockClear()
    ctrl.openFileDeepLink('/notes/b.md')
    expect(ctrl.activeTab).toBe('files')
    expect(mocks.push).toHaveBeenCalledWith({ query: { tab: 'files', file_path: '/notes/b.md' } })
  })

  it('drives the activity drawer through the shared drawer slot', async () => {
    const { ctrl } = setup({ tab: 'activity' })
    await flush()
    expect(ctrl.drawerOpen).toBe(false)
    ctrl.openActivityTask('task-1')
    expect(ctrl.activityDrawerKind).toBe('task')
    expect(ctrl.activityDrawerId).toBe('task-1')
    expect(ctrl.drawerOpen).toBe(true)
    ctrl.closeActivityDrawer()
    expect(ctrl.drawerOpen).toBe(false)
  })
})

describe('useProjectPageController actions', () => {
  it('delegates export start to the export controller', async () => {
    const { ctrl } = setup()
    await flush()
    const payload = { fields: [], citations_mode: 'keep' as const, include_sandbox_files: true }
    ctrl.exportProject(payload)
    expect(mocks.exports.start).toHaveBeenCalledWith(payload)
  })

  it('confirms project deletion and returns home', async () => {
    const { ctrl } = setup()
    await flush()
    ctrl.openDeleteConfirm()
    expect(ctrl.deleteConfirmOpen).toBe(true)
    await ctrl.confirmDeleteProject()
    expect(mocks.deleteProject).toHaveBeenCalledWith('project-one')
    expect(mocks.push).toHaveBeenCalledWith('/')
  })

  it('tracks summary generation with an independent loading flag', async () => {
    mocks.librarianForceAgentSummary.mockResolvedValue({ agent_summary: 'fresh' })
    const { ctrl } = setup()
    await flush()
    const pending = ctrl.forceAgentSummary()
    expect(ctrl.summaryUpdating).toBe(true)
    await pending
    expect(ctrl.summaryUpdating).toBe(false)
    expect(ctrl.overview.agentSummary).toBe('fresh')
  })
})
