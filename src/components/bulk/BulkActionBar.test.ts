import { describe, expect, it } from 'vitest'
import { createSSRApp, h, type Slots } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { i18n } from '@/i18n'

import BulkActionBar from './BulkActionBar.vue'

i18n.global.locale.value = 'en-US'

async function renderToolbar(
  props: { count: number; busy?: boolean },
  slots?: Slots,
): Promise<string> {
  const app = createSSRApp({ render: () => h(BulkActionBar, props, slots) })
  app.use(i18n)
  return renderToString(app)
}

describe('BulkActionBar', () => {
  it('renders the selected count, the caller actions and a clear control', async () => {
    const html = await renderToolbar(
      { count: 3 },
      { default: () => [h('button', { class: 'delete-action' }, 'Delete selected')] },
    )

    expect(html).toContain('3 selected')
    expect(html).toContain('delete-action')
    expect(html).toContain('aria-label="Clear selection"')
    expect(html).toContain('lucide-x')
  })

  it('shows the running indicator while a batch is in flight', async () => {
    const html = await renderToolbar({ count: 2, busy: true })

    expect(html).toContain('Running bulk action')
    expect(html).toContain('lucide-loader-circle')
  })
})
