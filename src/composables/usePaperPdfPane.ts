import { reactive, ref } from 'vue'

import type { PaperDetailResponse } from '@/types/api'

export const DEFAULT_PDF_PANE_WIDTH = 768
export const MIN_PDF_PANE_WIDTH = 512
export const MAX_PDF_PANE_WIDTH = 1280

export function usePaperPdfPane() {
  const open = ref(false)
  const width = ref(DEFAULT_PDF_PANE_WIDTH)
  const paperTitle = ref<string | null>(null)

  function toggle(paper: PaperDetailResponse): void {
    if (open.value) {
      close()
      return
    }
    paperTitle.value = paper.title
    open.value = true
  }

  function close(): void {
    open.value = false
    paperTitle.value = null
  }

  function reset(): void {
    close()
  }

  return reactive({
    open,
    width,
    paperTitle,
    toggle,
    close,
    reset,
  })
}
