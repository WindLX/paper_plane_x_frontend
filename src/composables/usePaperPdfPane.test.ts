import { describe, expect, it } from 'vitest'

import type { PaperDetailResponse } from '@/types/api'
import { DEFAULT_PDF_PANE_WIDTH, usePaperPdfPane } from './usePaperPdfPane'

const paper = {
  paper_id: 'pap-1',
  title: 'Resizable PDF paper',
} as PaperDetailResponse

describe('paper PDF pane state', () => {
  it('keeps the expanded layout until the leave transition finishes', () => {
    const pane = usePaperPdfPane()

    pane.toggle(paper)
    expect(pane.open).toBe(true)
    expect(pane.layoutOpen).toBe(true)
    expect(pane.paperTitle).toBe(paper.title)

    pane.close()
    expect(pane.open).toBe(false)
    expect(pane.layoutOpen).toBe(true)

    pane.finishClose()
    expect(pane.layoutOpen).toBe(false)
    expect(pane.paperTitle).toBeNull()
  })

  it('uses the wider default and preserves it across a reset', () => {
    const pane = usePaperPdfPane()
    expect(pane.width).toBe(DEFAULT_PDF_PANE_WIDTH)

    pane.width = 960
    pane.reset()
    expect(pane.width).toBe(960)
  })
})
