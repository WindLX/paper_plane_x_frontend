import { describe, expect, it } from 'vitest'
import { createSSRApp, h, type Slots } from 'vue'
import { renderToString } from 'vue/server-renderer'

import AppTable from './AppTable.vue'

async function renderTable(slots: Slots): Promise<string> {
  const app = createSSRApp({
    render: () => h(AppTable, { title: 'Library' }, slots),
  })
  return renderToString(app)
}

function headerHtml(html: string): string {
  const start = html.indexOf('<header')
  if (start === -1) return ''
  return html.slice(start, html.indexOf('</header>', start))
}

describe('AppTable', () => {
  it('renders the title above the horizontal scroll area that holds the table', async () => {
    const html = await renderTable({
      default: () => [
        h('table', { class: 'workspace-table' }, h('tbody', h('tr', h('td', 'row')))),
      ],
    })

    expect(html).toContain('workspace-table-shell')
    expect(html).toContain('overflow-x-auto')
    expect(html).toContain('workspace-table')
    expect(html).toContain('row')
    expect(headerHtml(html)).toContain('Library')
  })

  it('keeps the header free of an actions region when no toolbar is passed', async () => {
    const html = await renderTable({ default: () => [h('p', 'body')] })
    const header = headerHtml(html)

    expect(header).toContain('Library')
    expect(header).not.toContain('<div')
  })

  it('renders the toolbar in the header when a page provides the actions slot', async () => {
    const html = await renderTable({
      default: () => [h('p', 'body')],
      actions: () => [h('span', { class: 'toolbar' }, '3 selected')],
    })
    const header = headerHtml(html)

    expect(header).toContain('toolbar')
    expect(header).toContain('3 selected')
    expect(header).toContain('h-13')
    expect(header).toContain('overflow-x-auto')
    expect(header).not.toContain('flex-wrap')
  })
})
