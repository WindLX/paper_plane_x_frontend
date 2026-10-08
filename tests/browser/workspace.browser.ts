import { expect, test, type Locator, type Page } from '@playwright/test'

// Synthetic records only. Every API request is intercepted, including PDF bytes.
const project = {
  project_id: 'prj-test',
  name: 'Synthetic project',
  description: '',
  agent_summary: null,
  operation_logs: [],
  created_at: '2026-10-08',
  updated_at: '2026-10-08',
}
const paper = {
  paper_id: 'pap-test',
  project_ids: ['prj-test'],
  title: 'Synthetic paper',
  authors: ['SyntheticAuthor'.repeat(20)],
  publication: 'SyntheticPublication'.repeat(20),
  year: 2026,
  doi: '10.0000/' + 'synthetic-identifier'.repeat(20),
  custom_meta: null,
  raw_pdf_path: 'synthetic.pdf',
  raw_pdf_sha256: null,
  images_paths: [],
  agent_note: null,
  extraction_status: 'COMPLETED',
  extraction_fact_check_status: 'PASSED',
  analysis_fact_check_status: 'PASSED',
  extraction_retry_count: 0,
  analysis_retry_count: 0,
  created_at: '2026-10-08T00:00:00Z',
  updated_at: '2026-10-08T00:00:00Z',
}
const task = {
  task_id: 'tsk-test',
  paper_id: paper.paper_id,
  status: 'FAILED',
  created_at: paper.created_at,
  started_at: null,
  finished_at: null,
  error: null,
  retry_of_task_id: null,
  extraction_trace_ids: [],
  analysis_trace_ids: [],
  extraction_fact_check_trace_ids: [],
  analysis_fact_check_trace_ids: [],
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ppx-console-locale', 'en-US'))
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    let body: unknown = {}
    if (path === '/projects') body = { items: [project], total: 1, offset: 0, limit: 100 }
    else if (path === '/projects/prj-test') body = project
    else if (path === '/librarian/global-finder')
      body = {
        project_id: project.project_id,
        papers: [],
        stats: {
          paper_count: 1,
          top_tags_limit: 5,
          year_range: null,
          year_distribution: { available_count: 1, missing_count: 0, items: [] },
          top_tags: [],
        },
        agent_summary: null,
      }
    else if (path === '/projects/prj-test/files')
      body = { items: [{ name: 'notes.md', is_dir: false, size: 100 }] }
    else if (path === '/projects/prj-test/files/content')
      body = { file_path: '/notes.md', content: '# Notes\n\n[[pap-test | Synthetic paper]]' }
    else if (path === '/papers/pap-test') body = paper
    else if (path === '/papers/pap-test/pdf') {
      await route.fulfill({
        contentType: 'application/pdf',
        body: '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF',
      })
      return
    } else if (path === '/data-process/tasks')
      body = {
        items: [task],
        total: 1,
        offset: 0,
        limit: 20,
        queued: 0,
        running: 0,
        completed: 0,
        failed: 1,
        canceled: 0,
      }
    else if (path.endsWith('/status-counts'))
      body = {
        total: 1,
        extraction_pending: 0,
        extraction_processing: 0,
        extraction_completed: 1,
        extraction_human_completed: 0,
        extraction_failed: 0,
        extraction_fact_check_pending: 0,
        extraction_fact_check_passed: 1,
        extraction_fact_check_human_passed: 0,
        extraction_fact_check_failed: 0,
        analysis_fact_check_pending: 0,
        analysis_fact_check_passed: 1,
        analysis_fact_check_human_passed: 0,
        analysis_fact_check_failed: 0,
      }
    else if (path.endsWith('/search'))
      body = { paper_ids: [paper.paper_id], total: 1, offset: 0, limit: 20 }
    else if (path === '/papers/batch-get') body = { items: [paper], total: 1, offset: 0, limit: 1 }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.routeWebSocket('**/api/v1/**', (socket) => socket.close())
})

async function openLibrary(page: Page): Promise<void> {
  await page.goto('/library')
  await page.getByRole('row').filter({ hasText: 'Synthetic paper' }).click()
  await expect(page.getByRole('button', { name: 'Read PDF', exact: true })).toBeVisible()
}
async function detailWidth(page: Page): Promise<number> {
  return page
    .getByRole('button', { name: 'Close right sidebar', exact: true })
    .evaluate((el) => el.closest('[data-panel]')!.getBoundingClientRect().width)
}
async function drag(page: Page, handle: Locator, delta: number): Promise<void> {
  await expect(handle).toHaveAttribute('data-panel-resize-handle-enabled', 'true')
  await handle.hover()
  const box = await handle.boundingBox()
  expect(box).not.toBeNull()
  const x = box!.x + box!.width / 2,
    y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + delta, y, { steps: 12 })
  await page.mouse.up()
  await expect(handle).not.toHaveAttribute('data-state', 'drag')
}
async function expectContained(page: Page): Promise<void> {
  const viewport = page.viewportSize()!
  const iframe = page.locator('iframe')
  await expect(iframe).toBeVisible()
  const bounds = await iframe.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(-1)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1)
  if (await page.getByRole('button', { name: 'Close right sidebar', exact: true }).count()) {
    const right = await page
      .getByRole('button', { name: 'Close right sidebar', exact: true })
      .evaluate((el) => el.closest('[data-panel]')!.getBoundingClientRect().right)
    expect(right).toBeLessThanOrEqual(viewport.width + 1)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  )
}

for (const route of ['/library', '/tasks', '/projects/prj-test']) {
  test(`selection keeps table header height and does not open details: ${route}`, async ({
    page,
  }) => {
    await page.goto(route)
    if (route.includes('/projects/'))
      await page
        .locator('#app-topbar-page-actions')
        .getByRole('button', { name: 'Papers', exact: true })
        .click()
    const table = page.locator('.workspace-table-shell'),
      header = table.locator('header')
    await expect(table.getByRole('checkbox').nth(1)).toBeVisible()
    const height = await header.evaluate((el) => el.getBoundingClientRect().height)
    await expect(header.getByRole('button')).toHaveCount(0)
    await table.getByRole('checkbox').nth(1).focus()
    await page.keyboard.press('Space')
    await expect(table.getByRole('checkbox').nth(1)).toBeChecked()
    await expect(header.getByRole('button', { name: 'Clear selection' })).toBeVisible()
    expect(await header.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(height, 0)
    await expect(page.getByRole('button', { name: 'Close right sidebar' })).toHaveCount(0)
    await header.getByRole('button', { name: 'Clear selection' }).click()
    await expect(header.getByRole('button')).toHaveCount(0)
    expect(await header.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(height, 0)
  })
}

test('project files can open and close original paper PDF', async ({ page }) => {
  await page.goto('/projects/prj-test')
  await page.getByRole('button', { name: 'notes.md', exact: true }).click()
  await page.getByRole('link', { name: 'pap-test | Synthetic paper', exact: true }).click()
  await page.getByRole('button', { name: 'Read PDF', exact: true }).click()
  await expectContained(page)
  await page.getByRole('button', { name: 'Close PDF reader', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Read PDF', exact: true })).toBeVisible()
})

test('all three separators resize; PDF toggles preserve the resized detail width', async ({
  page,
}) => {
  await openLibrary(page)
  const left = page.getByRole('separator', { name: 'Resize left sidebar', exact: true })
  const detail = page.getByRole('separator', { name: 'Resize right sidebar', exact: true })
  await drag(page, left, 100)
  await expect
    .poll(() => page.evaluate(() => Number(localStorage.getItem('ppx-console-sidebar-width'))))
    .toBeGreaterThan(320)
  await page.getByRole('button', { name: 'Collapse navigation' }).click()
  await expect(left).toHaveCount(0)
  await page.getByRole('button', { name: 'Expand navigation' }).click()
  await expect(left).toBeVisible()
  await left.dblclick()
  await expect
    .poll(() =>
      page
        .locator('aside')
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeCloseTo(240, 0)
  await drag(page, detail, 100)
  const narrow = await detailWidth(page)
  await expect
    .poll(() => page.evaluate(() => Number(localStorage.getItem('ppx-console-drawer-width'))))
    .toBeCloseTo(narrow, 0)
  await page.getByRole('button', { name: 'Read PDF', exact: true }).click()
  await expectContained(page)
  await expect.poll(() => detailWidth(page)).toBeCloseTo(narrow, 0)
  const pdf = page.getByRole('separator', { name: 'Resize PDF reader', exact: true })
  const before = await page.locator('iframe').evaluate((el) => el.getBoundingClientRect().width)
  await drag(page, pdf, -80)
  await expect
    .poll(() => page.locator('iframe').evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(before + 50)
  await expect.poll(() => detailWidth(page)).toBeCloseTo(narrow, 0)
  await page.getByRole('button', { name: 'Close PDF reader' }).click()
  await expect.poll(() => detailWidth(page)).toBeCloseTo(narrow, 0)
  await detail.focus()
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => detailWidth(page)).toBeGreaterThan(narrow + 10)
  await detail.dblclick()
  await expect.poll(() => detailWidth(page)).toBeCloseTo(512, 0)
})

test('narrow middle scrolls a complete canvas and interrupted drags release interaction', async ({
  page,
}) => {
  await openLibrary(page)
  await page.getByRole('button', { name: 'Read PDF', exact: true }).click()
  await expectContained(page)
  const middle = page.locator('.workspace-content-scroll')
  const dimensions = await middle.evaluate((el) => ({
    available: el.clientWidth,
    full: el.scrollWidth,
  }))
  expect(dimensions.full).toBeGreaterThanOrEqual(960)
  expect(dimensions.full).toBeGreaterThan(dimensions.available)
  await middle.evaluate((el) => (el.scrollLeft = el.scrollWidth))
  expect(await middle.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  const handle = page.getByRole('separator', { name: 'Resize right sidebar', exact: true })
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, 400)
  await page.mouse.down()
  await page.mouse.move(box.x - 40, 400)
  // Exercise destruction while held without relying on a compatibility mouseup.
  await page
    .getByRole('button', { name: 'Close right sidebar' })
    .evaluate((el) => (el as HTMLButtonElement).click())
  await page.mouse.up()
  await page.getByRole('row').filter({ hasText: 'Synthetic paper' }).click()
  await drag(page, handle, -80)
  // Window blur aborts the gesture; a fresh drag and keyboard gesture still work.
  const next = (await handle.boundingBox())!
  await page.mouse.move(next.x + next.width / 2, 400)
  await page.mouse.down()
  await page.mouse.move(next.x - 30, 400)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.mouse.up()
  await expect(handle).not.toHaveAttribute('data-state', 'drag')
  await drag(page, handle, -40)
  const width = await detailWidth(page)
  await handle.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => detailWidth(page)).toBeLessThan(width - 10)
})

for (const theme of ['light', 'dark']) {
  test(`PDF bounds and long metadata adapt across viewports (${theme})`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('ppx-console-theme', theme), theme)
    await openLibrary(page)
    for (const width of [1920, 1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1080 })
      await expect(page.getByRole('button', { name: 'Read PDF', exact: true })).toBeVisible()
      const overflow = await page
        .locator('.paper-metadata > div')
        .evaluateAll((nodes) => nodes.some((el) => el.scrollWidth > el.clientWidth + 1))
      expect(overflow).toBe(false)
      await page.getByRole('button', { name: 'Read PDF', exact: true }).click()
      await expectContained(page)
      await page.getByRole('button', { name: 'Close PDF reader' }).click()
      await expect(page.locator('iframe')).toHaveCount(0)
    }
  })
}
