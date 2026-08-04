import { reactive, ref } from 'vue'

import type { PaperDetailResponse } from '@/types/api'

export const DEFAULT_PDF_PANE_WIDTH = 768
export const MIN_PDF_PANE_WIDTH = 512
export const MAX_PDF_PANE_WIDTH = 1280

export function usePaperPdfPane() {
  const open = ref(false)
  const layoutOpen = ref(false)
  const width = ref(DEFAULT_PDF_PANE_WIDTH)
  const paperTitle = ref<string | null>(null)

  function toggle(paper: PaperDetailResponse): void {
    if (open.value) {
      open.value = false
      return
    }
    paperTitle.value = paper.title
    layoutOpen.value = true
    open.value = true
  }

  function close(): void {
    open.value = false
  }

  function finishClose(): void {
    if (!open.value) {
      layoutOpen.value = false
      paperTitle.value = null
    }
  }

  function reset(): void {
    open.value = false
    layoutOpen.value = false
    paperTitle.value = null
  }

  return reactive({
    open,
    layoutOpen,
    width,
    paperTitle,
    toggle,
    close,
    finishClose,
    reset,
  })
}
