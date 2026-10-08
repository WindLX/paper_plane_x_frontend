import { describe, expect, it } from 'vitest'
import { createSSRApp, h, type Slots } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { i18n } from '@/i18n'
import type { DataProcessTaskResponse } from '@/types/api'

import TaskListTable from './TaskListTable.vue'

i18n.global.locale.value = 'en-US'

function task(taskId: string): DataProcessTaskResponse {
  return {
    task_id: taskId,
    paper_id: `paper-of-${taskId}`,
    status: 'COMPLETED',
    created_at: '2024-01-01T00:00:00Z',
    started_at: '2024-01-01T00:01:00Z',
    finished_at: '2024-01-01T00:02:00Z',
    error: null,
    retry_of_task_id: null,
    extraction_trace_ids: [],
    analysis_trace_ids: [],
    extraction_fact_check_trace_ids: [],
    analysis_fact_check_trace_ids: [],
  }
}

async function renderTable(
  props: { tasks: DataProcessTaskResponse[]; selectedIds?: string[]; selectionDisabled?: boolean },
  slots?: Slots,
): Promise<string> {
  const app = createSSRApp({
    render: () =>
      h(
        TaskListTable,
        {
          tasks: props.tasks,
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

describe('TaskListTable', () => {
  it('renders the page bulk controls inside the table header', async () => {
    const html = await renderTable(
      { tasks: [task('t-1')] },
      { actions: () => [h('span', { class: 'bulk-toolbar' }, '1 selected')] },
    )

    expect(headerHtml(html)).toContain('bulk-toolbar')
  })

  it('uses the task id in the row checkbox name', async () => {
    const html = await renderTable({ tasks: [task('t-1')], selectedIds: ['t-1'] })

    expect(html).toContain('aria-label="Deselect t-1"')
    expect(html).toContain('aria-label="Deselect page"')
  })
})
