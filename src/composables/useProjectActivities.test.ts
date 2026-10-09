import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProjectActivities } from './useProjectActivities'
import type { ProjectActivity } from '@/types/api'

const mocks = vi.hoisted(() => ({ listProjectActivities: vi.fn() }))

vi.mock('@/api', () => ({ api: { listProjectActivities: mocks.listProjectActivities } }))
vi.mock('@/i18n', () => ({ translate: (key: string) => key }))

function activity(id: string): ProjectActivity {
  return {
    activity_id: id,
    project_id: 'project-one',
    category: 'task',
    event_type: 'extraction.completed',
    status: 'completed',
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
}

const scopes: EffectScope[] = []

function setup() {
  const scope = effectScope()
  scopes.push(scope)
  const projectId = ref('project-one')
  const activities = scope.run(() => useProjectActivities(projectId))!
  return { activities, projectId }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.listProjectActivities.mockImplementation(
    async (_projectId: string, query: { offset?: number; limit?: number }) => ({
      items: [activity('a1')],
      total: 45,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
    }),
  )
})

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
})

describe('useProjectActivities', () => {
  it('queries the backend with the page size and omits empty filters', async () => {
    const { activities } = setup()
    await activities.load(0)
    expect(mocks.listProjectActivities).toHaveBeenCalledWith('project-one', {
      offset: 0,
      limit: 20,
      category: undefined,
      status: undefined,
      created_at_from: undefined,
      created_at_to: undefined,
      keyword: undefined,
    })
  })

  it('sends active filters and resets the offset when applying', async () => {
    const { activities } = setup()
    activities.filters.category = 'task'
    activities.filters.status = 'failed'
    activities.filters.keyword = '  extract  '
    activities.filters.created_at_from = '2026-01-01'
    activities.filters.created_at_to = '2026-01-02'
    activities.offset.value = 40
    await activities.load()
    expect(activities.offset.value).toBe(40)
    await activities.applyFilters()
    const lastCall = mocks.listProjectActivities.mock.calls.at(-1)!
    expect(lastCall[1]).toMatchObject({
      offset: 0,
      limit: 20,
      category: 'task',
      status: 'failed',
      keyword: 'extract',
      created_at_from: '2026-01-01T00:00:00',
      created_at_to: '2026-01-02T23:59:59.999999',
    })
  })

  it('resets to the first page when the row limit changes', async () => {
    const { activities } = setup()
    await activities.load(40)
    await activities.setLimit(50)
    expect(mocks.listProjectActivities).toHaveBeenLastCalledWith(
      'project-one',
      expect.objectContaining({ offset: 0, limit: 50 }),
    )
    expect(activities.currentPage.value).toBe(1)
    expect(activities.limit.value).toBe(50)
  })

  it('computes page navigation offsets and boundaries', async () => {
    const { activities } = setup()
    await activities.load(0)
    expect(activities.currentPage.value).toBe(1)
    expect(activities.totalPages.value).toBe(3)
    expect(activities.hasNextPage.value).toBe(true)
    await activities.nextPage()
    expect(activities.offset.value).toBe(20)
    await activities.setPage(3)
    expect(activities.offset.value).toBe(40)
    await activities.setPage(99)
    expect(activities.offset.value).toBe(40)
    await activities.prevPage()
    expect(activities.offset.value).toBe(20)
  })

  it('clears the feed and reports the failure message', async () => {
    mocks.listProjectActivities.mockRejectedValueOnce(new Error('activity down'))
    const { activities } = setup()
    await activities.load(0)
    expect(activities.error.value).toBe('activity down')
    expect(activities.items.value).toEqual([])
  })

  it('resets filters and page on project change', async () => {
    const { activities, projectId } = setup()
    activities.filters.keyword = 'x'
    projectId.value = 'project-two'
    await nextTick()
    expect(activities.filters.keyword).toBe('')
    expect(activities.items.value).toEqual([])
  })
})
