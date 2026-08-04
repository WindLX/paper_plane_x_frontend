<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  DEFAULT_PDF_PANE_WIDTH,
  MAX_PDF_PANE_WIDTH,
  MIN_PDF_PANE_WIDTH,
} from '@/composables/usePaperPdfPane'
import PaperPdfReader from './PaperPdfReader.vue'

const props = defineProps<{
  pdfOpen: boolean
  pdfWidth: number
  paperId: string | null
  paperTitle?: string | null
}>()

const emit = defineEmits<{
  closePdf: []
  pdfClosed: []
  'update:pdfWidth': [width: number]
}>()

const { t } = useI18n()
const resizing = ref(false)
let startX = 0
let startWidth = 0
let previousCursor = ''
let previousUserSelect = ''

const paneStyle = computed(() => ({
  '--pdf-pane-width': `${props.pdfWidth}px`,
}))

function maxAvailableWidth(): number {
  if (typeof window === 'undefined') return MAX_PDF_PANE_WIDTH
  return Math.max(MIN_PDF_PANE_WIDTH, window.innerWidth - MIN_PDF_PANE_WIDTH)
}

function setWidth(width: number): void {
  emit(
    'update:pdfWidth',
    Math.round(
      Math.min(MAX_PDF_PANE_WIDTH, maxAvailableWidth(), Math.max(MIN_PDF_PANE_WIDTH, width)),
    ),
  )
}

function handlePointerMove(event: PointerEvent): void {
  setWidth(startWidth + startX - event.clientX)
}

function stopResize(): void {
  if (!resizing.value) return
  resizing.value = false
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
  document.body.style.cursor = previousCursor
  document.body.style.userSelect = previousUserSelect
}

function startResize(event: PointerEvent): void {
  if (event.button !== 0) return
  event.preventDefault()
  resizing.value = true
  startX = event.clientX
  startWidth = props.pdfWidth
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopResize)
  window.addEventListener('pointercancel', stopResize)
  previousCursor = document.body.style.cursor
  previousUserSelect = document.body.style.userSelect
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleResizeKey(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft') setWidth(props.pdfWidth + 32)
  else if (event.key === 'ArrowRight') setWidth(props.pdfWidth - 32)
  else if (event.key === 'Home') setWidth(MIN_PDF_PANE_WIDTH)
  else if (event.key === 'End') setWidth(MAX_PDF_PANE_WIDTH)
  else return
  event.preventDefault()
}

onBeforeUnmount(stopResize)
</script>

<template>
  <div class="flex h-full min-w-0 justify-end overflow-x-hidden">
    <Transition
      enter-active-class="duration-ppx-standard ease-ppx-emphasis transition-[opacity,transform]"
      enter-from-class="translate-x-4 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="duration-ppx-standard ease-ppx transition-[opacity,transform]"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-4 opacity-0"
      @after-leave="emit('pdfClosed')"
    >
      <div
        v-if="pdfOpen && paperId"
        class="pdf-reader-pane relative h-full min-w-0 shrink-0"
        :style="paneStyle"
      >
        <div
          role="separator"
          aria-orientation="vertical"
          :aria-label="t('paper.pdf.resize')"
          :aria-valuemin="MIN_PDF_PANE_WIDTH"
          :aria-valuemax="MAX_PDF_PANE_WIDTH"
          :aria-valuenow="pdfWidth"
          tabindex="0"
          class="group absolute inset-y-0 left-0 z-30 hidden w-3 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none lg:flex"
          :title="t('paper.pdf.resizeHint')"
          @pointerdown="startResize"
          @keydown="handleResizeKey"
          @dblclick="setWidth(DEFAULT_PDF_PANE_WIDTH)"
        >
          <span
            class="bg-ppx-border-strong group-hover:bg-ppx-accent group-focus-visible:bg-ppx-accent absolute inset-y-0 left-0 w-0.5 transition-colors"
          />
        </div>
        <PaperPdfReader
          class="h-full w-full"
          :paper-id="paperId"
          :paper-title="paperTitle"
          @close="emit('closePdf')"
        />
      </div>
    </Transition>
    <div class="w-drawer h-full max-w-full shrink-0" :class="pdfOpen ? 'hidden lg:block' : 'block'">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pdf-reader-pane {
  width: 100%;
}

@media (min-width: 1024px) {
  .pdf-reader-pane {
    width: min(var(--pdf-pane-width), calc(100vw - var(--width-drawer)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .pdf-reader-pane {
    transition-duration: 0.01ms !important;
  }
}
</style>
