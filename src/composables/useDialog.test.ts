import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDialog } from './useDialog'
vi.mock('@/i18n', () => ({ translate: (key: string) => key }))
afterEach(() => useDialog().resolveDialog(false))
describe('shared dialog outcomes', () => {
  it('supports save, discard and cancel without changing boolean confirmations', async () => {
    const dialog = useDialog()
    const decision = dialog.choose({ title: 'Draft', message: 'Unsaved', secondaryText: 'Discard' })
    expect(dialog.state.secondaryText).toBe('Discard')
    dialog.resolveDialog('secondary')
    expect(await decision).toBe('secondary')
    const confirmation = dialog.confirm({ title: 'Delete', message: 'Confirm' })
    expect(dialog.state.secondaryText).toBe('')
    dialog.resolveDialog(true)
    expect(await confirmation).toBe(true)
  })
  it('cancels an earlier dialog when another replaces it, leaving no pending caller', async () => {
    const dialog = useDialog()
    const first = dialog.confirm({ title: 'First', message: 'First' })
    const next = dialog.choose({ title: 'Next', message: 'Next' })
    expect(await first).toBe(false)
    dialog.resolveDialog('cancel')
    expect(await next).toBe('cancel')
  })
})
