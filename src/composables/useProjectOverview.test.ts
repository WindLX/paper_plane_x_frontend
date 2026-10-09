import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProjectOverview } from './useProjectOverview'
import type { ProjectOverviewResponse } from '@/types/api'

const mocks = vi.hoisted(() => ({ getProjectOverview: vi.fn() }))

vi.mock('@/api', () => ({ api: { getProjectOverview: mocks.getProjectOverview } }))
vi.mock('@/i18n', () => ({ translate: (key: string) => key }))

function overviewResponse(): ProjectOverviewResponse {
  const activity = {
    activity_id: 'act',
    project_id: 'project-one',
    category: 'task' as const,
    event_type: 'extraction.completed',
    status: 'completed' as const,
    object_name: null,
    paper_id: null,
    file_path: null,
    task_id: null,
    trace_ids: [],
    created_at: '2026-10-08T00:00:00Z',
    updated_at: '2026-10-08T00:00:00Z',
    started_at: null,
    finished_at: null,
    error: null,
    retry_of_task_id: null,
    task_exists: false,
    detail: {},
  }
  return {
    project_id: 'project-one',
    agent_summary: 'summary',
    stats: { paper_count: 3, parsed_count: 2, active_task_count: 1, attention_count: 12 },
    attention_items: Array.from({ length: 12 }, (_v, index) => ({
      paper_id: `paper-attention-${index}`,
      title: null,
      stage: 'analysis',
      error: null,
      task_id: null,
    })),
    recent_papers: Array.from({ length: 8 }, (_v, index) => ({
      paper_id: `paper-${index}`,
      title: null,
      updated_at: '2026-10-08T00:00:00Z',
    })),
    recent_files: Array.from({ length: 8 }, (_v, index) => ({
      file_path: `/file-${index}.md`,
      name: `file-${index}.md`,
      kind: 'text' as const,
      size: 10,
      updated_at: '2026-10-08T00:00:00Z',
    })),
    recent_activities: Array.from({ length: 8 }, (_v, index) => ({
      ...activity,
      activity_id: `act-${index}`,
    })),
    top_tags: [{ tag: 'ml', count: 2 }],
    year_distribution: {
      available_count: 2,
      missing_count: 1,
      mean: 2020,
      variance: 1,
      median: 2020,
      mode_years: [2020],
      q25: 2019,
      q75: 2021,
      outlier_count: 0,
      low_outlier_count: 0,
      high_outlier_count: 0,
    },
    year_range: '2019-2021',
    section_errors: { attention: 'boom' },
  }
}

const scopes: EffectScope[] = []

function setup() {
  const scope = effectScope()
  scopes.push(scope)
  const projectId = ref('project-one')
  const overview = scope.run(() => useProjectOverview(projectId))!
  return { overview, projectId }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getProjectOverview.mockResolvedValue(overviewResponse())
})

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
})

describe('useProjectOverview', () => {
  it('loads on request and keeps only five recent items per list', async () => {
    const { overview } = setup()
    await overview.load()
    await nextTick()
    await Promise.resolve()
    expect(mocks.getProjectOverview).toHaveBeenCalledWith('project-one')
    expect(overview.recentPapers.value).toHaveLength(5)
    expect(overview.recentFiles.value).toHaveLength(5)
    expect(overview.recentActivities.value).toHaveLength(5)
    expect(overview.stats.value?.paper_count).toBe(3)
    expect(overview.sectionErrors.value).toEqual({ attention: 'boom' })
    // The stats count keeps the full total while the list is bounded.
    expect(overview.stats.value?.attention_count).toBe(12)
    expect(overview.attentionItems.value).toHaveLength(10)
  })

  it('surfaces the error message and clears the payload when loading fails', async () => {
    mocks.getProjectOverview.mockRejectedValueOnce(new Error('overview down'))
    const { overview } = setup()
    await overview.load()
    await nextTick()
    await Promise.resolve()
    await Promise.resolve()
    expect(overview.error.value).toBe('overview down')
    expect(overview.overview.value).toBeNull()
  })

  it('patches the agent summary in place', async () => {
    const { overview } = setup()
    await overview.load()
    await nextTick()
    await Promise.resolve()
    overview.patchAgentSummary('updated')
    expect(overview.agentSummary.value).toBe('updated')
  })
})
