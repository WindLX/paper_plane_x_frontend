<script setup lang="ts">
import { injectSplitterGroupContext, SplitterResizeHandle } from 'reka-ui'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ label: string; hint: string }>()
// Conditional handles are inserted after their group already exists. Register
// only once the element is mounted so Reka can attach its keyboard listener.
const ready = ref(false)
const group = injectSplitterGroupContext()
const active = ref(false)
const generation = ref(0)
onMounted(() => {
  ready.value = true
  window.addEventListener('blur', interruptResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('blur', interruptResize)
  finishResize()
})

const emit = defineEmits<{ dragging: [active: boolean]; commit: []; reset: [] }>()

function setDragging(dragging: boolean): void {
  active.value = dragging
  emit('dragging', dragging)
}
// A handle can disappear while held (close PDF/drawer, collapse navigation).
// Use the exported group lifecycle API to restore pane pointer events as well.
function finishResize(): void {
  if (!active.value) return
  group.stopDragging()
  setDragging(false)
}
function interruptResize(): void {
  if (!active.value) return
  finishResize()
  // A cancelled native pointer has no compatibility mouseup; remount only the
  // handle to dispose its native listeners and visual drag state.
  ready.value = false
  generation.value++
  void nextTick(() => {
    ready.value = true
  })
}

// Keep mouse events in the parent document when dragging across the PDF iframe.
// Geometry, keyboard behavior and listener cleanup belong to Reka's splitter.
function capturePointer(event: PointerEvent): void {
  if (ready.value && event.button === 0 && event.currentTarget instanceof HTMLElement)
    event.currentTarget.setPointerCapture(event.pointerId)
}
</script>

<template>
  <SplitterResizeHandle
    :key="generation"
    :disabled="!ready"
    :aria-disabled="!ready"
    :aria-label="label"
    :title="hint"
    :hit-area-margins="{ fine: 0, coarse: 0 }"
    class="group bg-ppx-bg-elevated data-[state=drag]:bg-ppx-accent-soft relative z-30 -mx-1 w-2 shrink-0 cursor-col-resize focus-visible:outline-none"
    @pointerdown="capturePointer"
    @dragging="setDragging"
    @pointercancel="interruptResize"
    @lostpointercapture="interruptResize"
    @keyup="emit('commit')"
    @dblclick="emit('reset')"
  >
    <span
      class="bg-ppx-border group-hover:bg-ppx-accent group-focus-visible:bg-ppx-accent group-data-[state=drag]:bg-ppx-accent absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors"
    />
  </SplitterResizeHandle>
</template>
