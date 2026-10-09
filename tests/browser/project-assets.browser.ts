import { expect, test, type Page } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })
const project = {
  project_id: 'prj-ui',
  name: 'Synthetic research',
  description: 'Synthetic workspace',
  agent_summary: null,
  operation_logs: [],
  created_at: '2026-10-09T00:00:00Z',
  updated_at: '2026-10-09T00:00:00Z',
}
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#e8f0fb"/><circle cx="150" cy="90" r="55" fill="#1f5c99"/></svg>'
const activity = {
  activity_id: 'act-1',
  project_id: project.project_id,
  category: 'file',
  event_type: 'file_written',
  status: 'completed',
  object_name: 'draft.md',
  paper_id: null,
  file_path: '/notes/draft.md',
  task_id: null,
  trace_ids: [],
  created_at: project.created_at,
  updated_at: project.updated_at,
  started_at: null,
  finished_at: null,
  error: null,
  retry_of_task_id: null,
  task_exists: false,
  detail: {},
}
const overview = {
  project_id: project.project_id,
  agent_summary: null,
  stats: { paper_count: 12, parsed_count: 10, active_task_count: 1, attention_count: 1 },
  attention_items: [
    {
      paper_id: 'pap-failed',
      title: 'Synthetic failed paper',
      stage: 'analysis',
      error: 'Synthetic model error',
      task_id: null,
    },
  ],
  recent_papers: [
    { paper_id: 'pap-recent', title: 'Synthetic recent paper', updated_at: project.updated_at },
  ],
  recent_files: [
    {
      file_path: '/notes/draft.md',
      name: 'draft.md',
      kind: 'text',
      size: 200,
      updated_at: project.updated_at,
    },
  ],
  recent_activities: [activity],
  top_tags: [
    { tag: 'control', count: 8 },
    { tag: 'learning', count: 4 },
  ],
  year_distribution: {
    available_count: 12,
    missing_count: 0,
    mean: 2024,
    variance: 2,
    median: 2024,
    mode_years: [2024],
    q25: 2023,
    q75: 2025,
    outlier_count: 0,
    low_outlier_count: 0,
    high_outlier_count: 0,
  },
  year_range: '2020–2026',
  section_errors: {},
}

async function workspace(page: Page) {
  const state = {
    jobs: [] as Array<Record<string, unknown>>,
    downloads: 0,
    reads: [] as string[],
    modelCalls: 0,
    overview: { ...overview, agent_summary: null as string | null },
    activities: [activity],
    activityError: false,
    lastActivityQuery: null as URLSearchParams | null,
  }
  await page.addInitScript(() => localStorage.setItem('ppx-console-locale', 'en-US'))
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    let body: unknown = {}
    if (path === '/projects') body = { items: [project], total: 1, offset: 0, limit: 100 }
    else if (path === '/projects/prj-ui') body = project
    else if (path === '/papers/pap-recent')
      body = {
        paper_id: 'pap-recent',
        project_ids: ['prj-ui'],
        title: 'Synthetic recent paper',
        authors: [],
        publication: null,
        year: 2026,
        doi: null,
        custom_meta: null,
        images_paths: [],
        raw_pdf_path: null,
        raw_pdf_sha256: null,
        agent_note: null,
        extraction_status: 'COMPLETED',
        extraction_fact_check_status: 'PASSED',
        analysis_fact_check_status: 'PASSED',
        extraction_retry_count: 0,
        analysis_retry_count: 0,
        created_at: project.created_at,
        updated_at: project.updated_at,
      }
    else if (path === '/papers') body = { items: [], total: 0, offset: 0, limit: 20 }
    else if (path === '/projects/prj-ui/overview') body = state.overview
    else if (path === '/projects/prj-ui/activities') {
      state.lastActivityQuery = url.searchParams
      if (state.activityError) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Synthetic activity failure' }),
        })
        return
      }
      const offset = Number(url.searchParams.get('offset') ?? 0)
      const limit = Number(url.searchParams.get('limit') ?? 20)
      body = {
        items: state.activities.slice(offset, offset + limit),
        total: state.activities.length,
        offset,
        limit,
      }
    } else if (path === '/projects/prj-ui/files') {
      const directory = url.searchParams.get('dir_path')
      body = {
        items:
          directory === '/images'
            ? [{ name: 'diagram.svg', is_dir: false, size: svg.length, kind: 'image' }]
            : directory === '/notes'
              ? [{ name: 'draft.md', is_dir: false, size: 200, kind: 'text' }]
              : [
                  { name: 'images', is_dir: true, size: null, kind: 'directory' },
                  { name: 'notes', is_dir: true, size: null, kind: 'directory' },
                ],
      }
    } else if (path === '/projects/prj-ui/files/content') {
      state.reads.push(url.searchParams.get('file_path')!)
      body = {
        file_path: '/notes/draft.md',
        content:
          '# Synthetic draft\n\n![Diagram](../images/diagram.svg)\n\n![Missing](../images/missing.png)\n\n[Long link](https://example.invalid/' +
          'long-path/'.repeat(60) +
          ')',
      }
    } else if (path === '/projects/prj-ui/files/preview') {
      if (url.searchParams.get('file_path') === '/images/missing.png')
        await route.fulfill({ status: 404, body: 'Synthetic missing image' })
      else await route.fulfill({ contentType: 'image/svg+xml', body: svg })
      return
    } else if (path === '/projects/prj-ui/exports') {
      if (request.method() === 'POST')
        state.jobs = [
          {
            export_id: 'exp-ui',
            project_id: project.project_id,
            status: 'queued',
            phase: 'preparing',
            processed_files: 0,
            total_files: null,
            current_file: null,
            error: null,
            download_name: null,
            file_size: null,
            created_at: project.created_at,
            finished_at: null,
            expires_at: null,
            cancel_requested: false,
          },
        ]
      body = request.method() === 'POST' ? state.jobs[0] : { items: state.jobs }
    } else if (path === '/projects/prj-ui/exports/exp-ui/download') {
      state.downloads++
      await route.fulfill({
        contentType: 'application/zip',
        body: 'synthetic zip',
        headers: { 'Content-Length': '13' },
      })
      return
    } else if (path === '/projects/prj-ui/exports/exp-ui/cancel') {
      Object.assign(state.jobs[0]!, { status: 'canceled', cancel_requested: true })
      body = state.jobs[0]
    } else if (path.startsWith('/librarian/')) state.modelCalls++
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.routeWebSocket('**/api/v1/**', (socket) => socket.close())
  return state
}

for (const theme of ['light', 'dark']) {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    test(`overview and image workspace fit ${viewport.width} (${theme})`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.addInitScript((theme) => localStorage.setItem('ppx-console-theme', theme), theme)
      const state = await workspace(page)
      await page.goto('/projects/prj-ui')
      await expect(page.getByRole('heading', { name: 'Needs Attention' })).toBeVisible()
      expect(state.modelCalls).toBe(0)
      await expect(
        page.getByRole('button', { name: 'Generate summary', exact: true }),
      ).toBeVisible()
      await page.screenshot({ path: test.info().outputPath('overview.png') })
      await page.goto('/projects/prj-ui?tab=files&file_path=%2Fnotes%2Fdraft.md')
      const image = page.getByRole('img', { name: 'Diagram', exact: true })
      await expect(image).toBeVisible()
      await expect(image).toHaveAttribute('src', /file_path=%2Fimages%2Fdiagram.svg/)
      await expect(
        page.getByText('Image failed to load: /images/missing.png', { exact: true }),
      ).toBeVisible()
      const imageBounds = await image.boundingBox()
      expect(imageBounds!.x + imageBounds!.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      )
      await page.screenshot({ path: test.info().outputPath('markdown-images.png') })
      if (viewport.width < 1024) {
        await page.getByRole('button', { name: 'File tree', exact: true }).click()
        await expect(page.getByRole('separator', { name: 'Resize file tree' })).toHaveCount(0)
      }
      await page.getByRole('button', { name: 'diagram.svg', exact: true }).click()
      await expect(page.getByRole('img', { name: 'diagram.svg', exact: true })).toBeVisible()
      expect(state.reads).not.toContain('/images/diagram.svg')
      await page.screenshot({ path: test.info().outputPath('image-preview.png') })
    })
  }
}

test('tree gestures persist and compact mode does not overwrite the preference', async ({
  page,
}) => {
  await workspace(page)
  await page.goto('/projects/prj-ui?tab=files')
  const handle = page.getByRole('separator', { name: 'Resize file tree', exact: true })
  await expect(handle).toHaveAttribute('data-panel-resize-handle-enabled', 'true')
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 70, box.y + box.height / 2, { steps: 15 })
  await page.mouse.up()
  const width = await page.evaluate(() =>
    Number(localStorage.getItem('ppx-console-file-tree-width')),
  )
  expect(width).toBeGreaterThan(290)
  expect(width).toBeLessThanOrEqual(400)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(handle).toHaveCount(0)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await expect(handle).toBeVisible()
  expect(
    await page.evaluate(() => Number(localStorage.getItem('ppx-console-file-tree-width'))),
  ).toBe(width)
  await handle.dblclick()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('ppx-console-file-tree-width')))
    .toBe('256')
  await handle.focus()
  await page.keyboard.press('ArrowRight')
  await expect
    .poll(() => page.evaluate(() => Number(localStorage.getItem('ppx-console-file-tree-width'))))
    .toBeGreaterThan(256)
})

test('ZIP progress is real, survives reload, and can download again', async ({ page }) => {
  const state = await workspace(page)
  await page.goto('/projects/prj-ui')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.getByRole('button', { name: /^Export \(/ }).click()
  const jobs = page.getByRole('region', { name: 'Export jobs' })
  await expect(jobs.getByText('Collecting files', { exact: true })).toBeVisible()
  Object.assign(state.jobs[0]!, {
    status: 'running',
    phase: 'packing',
    total_files: 2,
    processed_files: 1,
    current_file: 'project_files/notes/draft.md',
  })
  await expect(jobs.getByText('Packed 1 / 2 files')).toBeVisible()
  await expect(jobs.getByRole('progressbar')).toHaveAttribute('value', '50')
  await page.screenshot({ path: test.info().outputPath('export-progress.png') })
  const downloaded = page.waitForEvent('download')
  Object.assign(state.jobs[0]!, {
    status: 'completed',
    phase: 'ready',
    processed_files: 2,
    file_size: 13,
    download_name: 'synthetic.zip',
    finished_at: project.updated_at,
    expires_at: '2026-10-10T00:00:00Z',
  })
  expect((await downloaded).suggestedFilename()).toBe('synthetic.zip')
  await page.reload()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(jobs.getByRole('button', { name: 'Download', exact: true })).toBeVisible()
  expect(state.downloads).toBe(1)
  const again = page.waitForEvent('download')
  await jobs.getByRole('button', { name: 'Download', exact: true }).click()
  await again
  expect(state.downloads).toBe(2)
})

test('overview opens recent files and papers, shows statistics, and More actions opens', async ({
  page,
}) => {
  await workspace(page)
  await page.goto('/projects/prj-ui')
  await expect(
    page
      .locator('span')
      .filter({ hasText: /^control8$/ })
      .first(),
  ).toBeVisible()
  await expect(page.getByText('2020–2026', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /^draft.md/ }).click()
  await expect(page).toHaveURL(/tab=files/)
  await expect(page.getByRole('heading', { name: 'Synthetic draft' })).toBeVisible()
  await page.goBack()
  await page.getByRole('button', { name: /^Synthetic recent paper/ }).click()
  await expect(page).toHaveURL(/paper_id=pap-recent/)
  await expect(page.getByRole('button', { name: 'Close right sidebar' })).toBeVisible()
})

test('More menu responds to mouse and keyboard', async ({ page }) => {
  await workspace(page)
  await page.goto('/projects/prj-ui')
  const more = page.getByRole('button', { name: 'More actions', exact: true })
  await more.click()
  await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await more.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeVisible()
})

test('recent paper opens a visible drawer', async ({ page }) => {
  await workspace(page)
  await page.goto('/projects/prj-ui')
  await page.getByRole('button', { name: /^Synthetic recent paper/ }).click()
  await expect(page).toHaveURL(/paper_id=pap-recent/)
  await expect(page.getByRole('button', { name: 'Close right sidebar' })).toBeVisible()
})

test('recent activity opens its details', async ({ page }) => {
  await workspace(page)
  await page.goto('/projects/prj-ui')
  await page.getByRole('button', { name: /^Wrote file draft.md/ }).click()
  await expect(page).toHaveURL(/tab=activity.*activity_id=act-1/)
  await expect(page.getByText('file_written', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Collapse details' })).toBeVisible()
})

for (const theme of ['light', 'dark']) {
  for (const width of [1920, 1366, 390]) {
    test(`Chinese activity filters and menu fit ${width} (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 })
      await workspace(page)
      await page.addInitScript((theme) => {
        localStorage.setItem('ppx-console-locale', 'zh-CN')
        localStorage.setItem('ppx-console-theme', theme)
      }, theme)
      await page.goto('/projects/prj-ui?tab=activity')
      const category = page.getByRole('button', { name: '类别', exact: true })
      await category.click()
      const option = page.getByRole('button', { name: '论文', exact: true })
      await expect(option).toBeVisible()
      await expect(option.locator('..')).toHaveCSS('opacity', '1')
      const bounds = (await option.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(140)
      expect(bounds.height).toBeLessThan(50)
      await page.screenshot({ path: test.info().outputPath('activity-filters.png') })
      await option.click()
      await expect(option).toBeHidden()
      await expect(category).toContainText('论文')
      await page.screenshot({ path: test.info().outputPath('activity.png') })
    })
  }
}

test('activity date picker supports selection, clearing, month navigation and keyboard', async ({
  page,
}) => {
  const state = await workspace(page)
  await page.goto('/projects/prj-ui?tab=activity')
  const trigger = page.getByRole('button', { name: 'From', exact: true })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const calendar = page.getByRole('dialog', { name: 'From', exact: true })
  await expect(calendar).toBeVisible()
  await calendar.getByRole('button', { name: 'Previous month', exact: true }).click()
  await calendar.getByRole('button', { name: 'Next month', exact: true }).click()
  await calendar.getByRole('spinbutton', { name: 'Year', exact: true }).fill('2000')
  await calendar.getByRole('spinbutton', { name: 'Year', exact: true }).press('Enter')
  const selected = calendar.locator('[data-value="2000-10-09"]')
  const value = await selected.getAttribute('data-value')
  await selected.click()
  await expect(calendar).toBeHidden()
  await page.getByRole('button', { name: 'Filter', exact: true }).click()
  await expect.poll(() => state.lastActivityQuery?.get('created_at_from')).toBe(`${value}T00:00:00`)
  await page.getByRole('button', { name: 'Clear From', exact: true }).click()
  await page.getByRole('button', { name: 'Filter', exact: true }).click()
  await expect.poll(() => state.lastActivityQuery?.get('created_at_from')).toBeNull()
  await trigger.click()
  await page.screenshot({ path: test.info().outputPath('calendar.png') })
  await page.keyboard.press('Escape')
  await expect(calendar).toBeHidden()
})

for (const theme of ['light', 'dark']) {
  for (const width of [1920, 1366, 390]) {
    test(`activity content empty error share the table shell and one scroll ${width} (${theme})`, async ({
      page,
    }) => {
      const state = await workspace(page)
      state.activities = Array.from({ length: 40 }, (_, i) => ({
        ...activity,
        activity_id: `act-${i}`,
        object_name: `Synthetic document ${i}.md`,
      }))
      await page.setViewportSize({ width, height: width === 390 ? 844 : 768 })
      await page.addInitScript((theme) => localStorage.setItem('ppx-console-theme', theme), theme)
      await page.goto('/projects/prj-ui?tab=activity')
      const shell = page.locator('[data-activity-table]')
      await expect(shell.getByRole('columnheader', { name: 'Activity', exact: true })).toBeVisible()
      await expect(shell.locator('[data-activity-id]')).toHaveCount(20)
      const scroller = page.locator('[data-activity-scroll]')
      expect(await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
      await scroller.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible()
      await page.screenshot({ path: test.info().outputPath('activity-bottom.png') })
      await scroller.evaluate((el) => {
        el.scrollTop = 0
      })
      await page.screenshot({ path: test.info().outputPath('activity-list.png') })
      state.activities = []
      await page.getByRole('button', { name: 'Refresh', exact: true }).click()
      await expect(shell.getByText('No activity recorded', { exact: true })).toBeInViewport()
      await expect(shell.getByRole('columnheader', { name: 'Actions', exact: true })).toBeVisible()
      await page.screenshot({ path: test.info().outputPath('activity-empty.png') })
      state.activityError = true
      await page.getByRole('button', { name: 'Refresh', exact: true }).click()
      await expect(shell.getByRole('alert')).toContainText('Synthetic activity failure')
      await expect(shell.getByRole('alert')).toBeInViewport()
      await expect(shell.getByRole('columnheader', { name: 'Activity', exact: true })).toBeVisible()
      await page.screenshot({ path: test.info().outputPath('activity-error.png') })
    })
  }
}

test('activity page size changes reset the page and render the requested count', async ({
  page,
}) => {
  const state = await workspace(page)
  state.activities = Array.from({ length: 80 }, (_, i) => ({
    ...activity,
    activity_id: `act-${i}`,
  }))
  await page.goto('/projects/prj-ui?tab=activity')
  await expect(page.locator('[data-activity-id]')).toHaveCount(20)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect.poll(() => state.lastActivityQuery?.get('offset')).toBe('20')
  await page.getByRole('button', { name: '20', exact: true }).click()
  await page.getByRole('button', { name: '50', exact: true }).click()
  await expect.poll(() => state.lastActivityQuery?.get('limit')).toBe('50')
  await expect.poll(() => state.lastActivityQuery?.get('offset')).toBe('0')
  await expect(page.locator('[data-activity-id]')).toHaveCount(50)
})

test('overview links expose hover and keyboard focus with navigation cues', async ({ page }) => {
  await workspace(page)
  await page.goto('/projects/prj-ui')
  const row = page.getByRole('button', { name: /^Synthetic recent paper/ })
  const background = await row.evaluate((el) => getComputedStyle(el).backgroundColor)
  await row.hover()
  await expect
    .poll(() => row.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(background)
  await expect(row.locator('.overview-link-arrow')).toBeVisible()
  await row.focus()
  await expect(row).toHaveCSS('outline-style', 'solid')
  await page.screenshot({ path: test.info().outputPath('overview-hover.png') })
})

for (const theme of ['light', 'dark']) {
  test(`rich overview uses full summary width and natural card heights (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    const state = await workspace(page)
    state.overview.agent_summary =
      '合成研究摘要：本项目围绕控制与学习方法整理研究问题、已有证据和后续实验，比较不同方法的适用条件与限制。'.repeat(
        10,
      )
    state.overview.top_tags = Array.from({ length: 8 }, (_, i) => ({
      tag: `研究标签 ${i + 1}`,
      count: 60 - i * 5,
    }))
    await page.addInitScript((theme) => localStorage.setItem('ppx-console-theme', theme), theme)
    await page.goto('/projects/prj-ui')
    const summary = page.locator('.overview-summary')
    await expect(summary).toContainText('合成研究摘要')
    const widths = await summary.evaluate((el) => ({
      body: el.clientWidth,
      card: el.parentElement!.clientWidth,
    }))
    expect(widths.body).toBeGreaterThan(widths.card - 40)
    expect(state.modelCalls).toBe(0)
    await page.screenshot({ path: test.info().outputPath('overview-rich.png') })
  })
}
