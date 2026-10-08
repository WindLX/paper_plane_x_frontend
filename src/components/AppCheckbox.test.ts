import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import AppCheckbox from './AppCheckbox.vue'

type CheckboxProps = {
  label: string
  checked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  checkedLabel?: string
  indeterminateLabel?: string
  disabledLabel?: string
}

async function renderCheckbox(props: CheckboxProps): Promise<string> {
  const app = createSSRApp({ render: () => h(AppCheckbox, props) })
  return renderToString(app)
}

/** Vue SSR emits boolean attributes as bare, space separated tokens. */
function hasBooleanAttribute(html: string, name: string): boolean {
  return html.replace(/>$/, '').split(' ').includes(name)
}

function inputTag(html: string): string {
  const start = html.indexOf('<input')
  const end = html.indexOf('>', start)
  return html.slice(start, end + 1)
}

describe('AppCheckbox', () => {
  it('renders a native unchecked checkbox with the base accessible name', async () => {
    const html = await renderCheckbox({ label: 'Select item' })
    const tag = inputTag(html)

    expect(tag).toContain('type="checkbox"')
    expect(tag).toContain('aria-label="Select item"')
    expect(hasBooleanAttribute(tag, 'checked')).toBe(false)
    expect(hasBooleanAttribute(tag, 'disabled')).toBe(false)
  })

  it('renders the checked state with a check mark and the checked name', async () => {
    const html = await renderCheckbox({
      label: 'Select item',
      checked: true,
      checkedLabel: 'Deselect item',
    })

    expect(hasBooleanAttribute(inputTag(html), 'checked')).toBe(true)
    expect(html).toContain('aria-label="Deselect item"')
    expect(html).toContain('lucide-check')
  })

  it('renders a dash and the indeterminate name while the state is mixed', async () => {
    const html = await renderCheckbox({
      label: 'Select page',
      indeterminate: true,
      indeterminateLabel: 'Page partially selected',
    })

    expect(inputTag(html)).toContain('aria-label="Page partially selected"')
    expect(html).toContain('lucide-minus')
    expect(html).not.toContain('lucide-check')
  })

  it('disables the input and prefers the disabled name', async () => {
    const html = await renderCheckbox({
      label: 'Select page',
      checked: true,
      checkedLabel: 'Deselect page',
      disabled: true,
      disabledLabel: 'No selectable items on this page',
    })
    const tag = inputTag(html)

    expect(hasBooleanAttribute(tag, 'disabled')).toBe(true)
    expect(tag).toContain('aria-label="No selectable items on this page"')
  })
})
