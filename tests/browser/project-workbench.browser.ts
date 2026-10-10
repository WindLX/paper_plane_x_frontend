import { expect, test } from '@playwright/test'

// Synthetic records only. Every API request is intercepted.
const project = {
  project_id: 'prj-test',
  name: 'Synthetic project',
  description: '',
  agent_summary: 'Synthetic summary',
  operation_logs: [],
  created_at: '2026-10-08',
  updated_at: '2026-10-08',
}

const stats = { paper_count: 3, parsed_count: 2, active_task_count: 1, attention_count: 1 }

const overview = {
  project_id: project.project_id,
  agent_summary: project.agent_summary,
  stats,
  attention_items: [
    {
      paper_id: 'pap-attention',
      title: 'Attention paper',
      stage: 'analysis',
      error: null,
      task_id: null,
    },
  ],
  recent_papers: [
    { paper_id: 'pap-recent', title: 'Recent paper', updated_at: '2026-10-08T00:00:00Z' },
  ],
  recent_files: [
    {
      file_path: '/notes.md',
      name: 'notes.md',
      kind: 'text',
      size: 2048,
      updated_at: '2026-10-08T00:00:00Z',
    },
  ],
  recent_activities: [
    {
      activity_id: 'act-recent',
      project_id: project.project_id,
      category: 'file',
      event_type: 'file.updated',
      status: 'info',
      object_name: '/notes.md',
      paper_id: null,
      file_path: '/notes.md',
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
    },
  ],
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
  section_errors: {},
}

const activity = {
  activity_id: 'act-1',
  project_id: project.project_id,
  category: 'task',
  event_type: 'task_completed',
  status: 'completed',
  object_name: 'Synthetic paper',
  paper_id: 'pap-recent',
  file_path: null,
  task_id: 'tsk-missing',
  trace_ids: ['trc-1'],
  created_at: '2026-10-08T00:00:00Z',
  updated_at: '2026-10-08T00:00:00Z',
  started_at: '2026-10-08T00:00:01Z',
  finished_at: '2026-10-08T00:00:02Z',
  error: null,
  retry_of_task_id: null,
  task_exists: false,
  detail: { retry_count: 0 },
}

let lastActivityQuery: URLSearchParams | null = null

test.beforeEach(async ({ page }) => {
  lastActivityQuery = null
  await page.addInitScript(() => localStorage.setItem('ppx-console-locale', 'en-US'))
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    let body: unknown = {}
    if (path === '/projects') body = { items: [project], total: 1, offset: 0, limit: 100 }
    else if (path === '/projects/prj-test') body = project
    else if (path === '/projects/prj-test/overview') body = overview
    else if (path === '/projects/prj-test/activities') {
      lastActivityQuery = url.searchParams
      body = { items: [activity], total: 1, offset: 0, limit: 20 }
    } else if (path === '/projects/prj-test/files') body = { items: [] }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.routeWebSocket('**/api/v1/**', (socket) => socket.close())
})

test('defaults to the overview tab and navigates with the tab query parameter', async ({
  page,
}) => {
  await page.goto('/projects/prj-test')
  const actions = page.locator('#app-topbar-page-actions')
  await expect(page.getByRole('heading', { name: 'Needs Attention' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent Files' })).toBeVisible()
  await expect(page).toHaveURL(/\/projects\/prj-test$/)

  await actions.getByRole('button', { name: 'Activity', exact: true }).click()
  await expect(page).toHaveURL(/tab=activity/)
  await expect(page.getByText('Project Activity', { exact: true })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/projects\/prj-test$/)
  await expect(page.getByRole('heading', { name: 'Needs Attention' })).toBeVisible()

  await page.goForward()
  await expect(page).toHaveURL(/tab=activity/)
  await expect(page.getByText('Project Activity', { exact: true })).toBeVisible()
})

test('activity filters drive the request and rows expand into technical detail', async ({
  page,
}) => {
  await page.goto('/projects/prj-test?tab=activity')
  await expect(page.getByText('Task completed Synthetic paper', { exact: true })).toBeVisible()
  await expect.poll(() => lastActivityQuery?.get('limit')).toBe('20')

  await page.getByPlaceholder('Search object or event…').fill('extraction')
  await page.getByRole('button', { name: 'Filter', exact: true }).click()
  await expect.poll(() => lastActivityQuery?.get('keyword')).toBe('extraction')

  await page.getByRole('button', { name: 'Expand details' }).first().click()
  await expect(page.getByText('Task times', { exact: true })).toBeVisible()
  await expect(page.getByText('task_completed', { exact: true })).toBeVisible()
  await expect(page.getByText('The linked task no longer exists')).toBeVisible()
})

test('project ID stays copyable in the topbar across tabs', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/projects/prj-test')
  const copy = page.locator('header').getByRole('button', { name: 'prj-test', exact: true })
  await expect(copy).toBeVisible()
  await copy.click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('prj-test')
  await page
    .locator('#app-topbar-page-actions')
    .getByRole('button', { name: 'Files', exact: true })
    .click()
  await expect(copy).toBeVisible()
  await expect(copy).toHaveAttribute('title', 'Project ID: prj-test')
})

test('project IDs use available title width and truncate only when space runs out', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const projectId = 'prj-0123456789abcdef0123456789abcdef'
  await page.route(`**/api/v1/projects/${projectId}**`, async (route) => {
    const body = new URL(route.request().url()).pathname.endsWith('/overview')
      ? { ...overview, project_id: projectId }
      : { ...project, project_id: projectId }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(`/projects/${projectId}`)
  const header = page.locator('header')
  const copy = header.getByRole('button', { name: projectId, exact: true })
  await expect(copy).toBeVisible()
  await expect(copy).toHaveAttribute('title', `Project ID: ${projectId}`)
  const titleBox = await header.getByRole('heading').boundingBox()
  const copyBox = await copy.boundingBox()
  expect(
    Math.abs(titleBox!.y + titleBox!.height / 2 - copyBox!.y - copyBox!.height / 2),
  ).toBeLessThan(2)
  const idText = copy.locator('span')
  expect(await idText.evaluate((element) => element.scrollWidth === element.clientWidth)).toBe(true)
  expect((await header.boundingBox())!.height).toBeLessThanOrEqual(72)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(copy).toBeVisible()
  expect(await idText.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  expect(
    await header
      .getByRole('heading')
      .evaluate((element) => element.scrollWidth === element.clientWidth),
  ).toBe(true)
  expect((await copy.boundingBox())!.x + (await copy.boundingBox())!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: '/tmp/ppx-project-id-flex-390.png' })
  await copy.click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(projectId)

  await page.setViewportSize({ width: 1366, height: 768 })
  expect(await idText.evaluate((element) => element.scrollWidth === element.clientWidth)).toBe(true)
  await page.screenshot({ path: '/tmp/ppx-project-id-flex-1366.png' })
})

for (const width of [1920, 1366, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`overview statistics lead the research content at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 })
      await page.addInitScript((theme) => localStorage.setItem('ppx-console-theme', theme), theme)
      await page.goto('/projects/prj-test')
      const stats = page.locator('.overview-stats')
      const tags = page.getByRole('heading', { name: 'Top Tags' })
      const attention = page.getByRole('heading', { name: 'Needs Attention' })
      await expect(stats).toBeVisible()
      await expect(tags).toBeVisible()
      const statsBox = await stats.boundingBox()
      const tagsBox = await tags.boundingBox()
      const attentionBox = await attention.boundingBox()
      expect(statsBox!.y + statsBox!.height).toBeLessThan(tagsBox!.y)
      expect(tagsBox!.y).toBeLessThan(attentionBox!.y)
      await expect(
        page.locator('header').getByRole('button', { name: 'prj-test', exact: true }),
      ).toBeVisible()
      await page.screenshot({ path: `/tmp/ppx-project-header-${width}-${theme}.png` })
    })
  }
}
