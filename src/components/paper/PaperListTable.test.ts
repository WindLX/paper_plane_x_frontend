import { describe, expect, it } from 'vitest'
import { createSSRApp, h, type Slots } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { i18n } from '@/i18n'
import type { PaperResponse } from '@/types/api'

import PaperListTable from './PaperListTable.vue'

i18n.global.locale.value = 'en-US'

function paper(paperId: string): PaperResponse {
  return {
    paper_id: paperId,
    project_ids: [],
    title: `Paper ${paperId}`,
    authors: ['A. Author'],
    year: 2024,
    publication: null,
    doi: null,
    custom_meta: null,
    raw_pdf_path: null,
    raw_pdf_sha256: null,
    images_paths: [],
    extraction_status: 'COMPLETED',
    extraction_fact_check_status: 'PASSED',
    analysis_fact_check_status: 'PENDING',
    extraction_retry_count: 0,
    analysis_retry_count: 0,
    agent_note: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }
}

async function renderTable(
  props: { papers: PaperResponse[]; selectedIds?: string[]; selectionDisabled?: boolean },
  slots?: Slots,
): Promise<string> {
  const app = createSSRApp({
    render: () =>
      h(
        PaperListTable,
        {
          title: 'Library',
          papers: props.papers,
          offset: 0,
          sortBy: 'created_at',
          sortOrder: 'desc',
          selectedIds: props.selectedIds ?? [],
          selectionDisabled: props.selectionDisabled,
        },
        slots,
      ),
  })
  app.use(i18n)
  return renderToString(app)
}

function headerHtml(html: string): string {
  const start = html.indexOf('<header')
  if (start === -1) return ''
  return html.slice(start, html.indexOf('</header>', start))
}

/** Vue SSR emits boolean attributes as bare, space separated tokens. */
function hasBooleanAttribute(tag: string, name: string): boolean {
  return tag.replace(/>$/, '').split(' ').includes(name)
}

function inputTags(html: string): string[] {
  const tags: string[] = []
  let cursor = html.indexOf('<input')
  while (cursor !== -1) {
    const end = html.indexOf('>', cursor)
    tags.push(html.slice(cursor, end + 1))
    cursor = html.indexOf('<input', end)
  }
  return tags
}

function disabledInputCount(html: string): number {
  return inputTags(html).filter((tag) => hasBooleanAttribute(tag, 'disabled')).length
}

describe('PaperListTable', () => {
  it('renders the page bulk controls inside the table header', async () => {
    const html = await renderTable(
      { papers: [paper('p-1')] },
      { actions: () => [h('span', { class: 'bulk-toolbar' }, '1 selected')] },
    )
    const header = headerHtml(html)

    expect(header).toContain('bulk-toolbar')
    expect(header).toContain('1 selected')
  })

  it('reserves no header actions region without a toolbar', async () => {
    const html = await renderTable({ papers: [paper('p-1')] })

    expect(headerHtml(html)).not.toContain('<div')
  })

  it('names the page and row checkboxes after their current state', async () => {
    const html = await renderTable({ papers: [paper('p-1'), paper('p-2')], selectedIds: ['p-1'] })

    expect(html).toContain('aria-label="Page partially selected; select page"')
    expect(html).toContain('aria-label="Deselect p-1"')
    expect(html).toContain('aria-label="Select p-2"')
  })

  it('disables the page and row checkboxes while a bulk action runs', async () => {
    const html = await renderTable({ papers: [paper('p-1')], selectionDisabled: true })

    expect(disabledInputCount(html)).toBe(2)
    expect(html).toContain('aria-label="p-1 cannot be selected"')
  })

  it('shows the empty state when the page has no papers', async () => {
    const html = await renderTable({ papers: [] })

    expect(html).toContain('workspace-table-empty')
    expect(disabledInputCount(html)).toBe(1)
  })
})
