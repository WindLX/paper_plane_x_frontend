<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { SplitterPanel } from 'reka-ui'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'
import { DEFAULT_DRAWER_WIDTH, MIN_DRAWER_WIDTH, MAX_DRAWER_WIDTH } from '@/utils/drawerWidth'
import {
  DEFAULT_PDF_PANE_WIDTH,
  MIN_PDF_PANE_WIDTH,
  MAX_PDF_PANE_WIDTH,
} from '@/composables/usePaperPdfPane'
import PaneResizeHandle from './PaneResizeHandle.vue'

const props = defineProps<{ expanded: boolean; pdfWidth: number; compact: boolean }>()
const emit = defineEmits<{ 'update:pdfWidth': [width: number] }>()
const { t } = useI18n()
const ui = useUiStore()
const detailPanel = ref<InstanceType<typeof SplitterPanel> | null>(null)
const pdfPanel = ref<InstanceType<typeof SplitterPanel> | null>(null)
const dragging = ref(false)

async function restoreDetailWidth(): Promise<void> {
  await nextTick()
  if (!props.compact) detailPanel.value?.resize(ui.drawerWidth)
}
onMounted(restoreDetailWidth)
watch(() => [props.expanded, props.compact], restoreDetailWidth, { flush: 'post' })

async function commitWidths(): Promise<void> {
  await nextTick()
  // Only user gestures update preferences; mounting and responsive fitting don't.
  if (!props.compact && detailPanel.value) ui.setDrawerWidth(detailPanel.value.getSize())
  if (!props.compact && pdfPanel.value)
    emit('update:pdfWidth', Math.round(pdfPanel.value.getSize()))
}
function setDragging(active: boolean): void {
  dragging.value = active
  if (!active) void commitWidths()
}
function resetDetail(): void {
  detailPanel.value?.resize(DEFAULT_DRAWER_WIDTH)
  void commitWidths()
}
function resetPdf(): void {
  pdfPanel.value?.resize(DEFAULT_PDF_PANE_WIDTH)
  void commitWidths()
}
</script>

<template>
  <template v-if="expanded">
    <PaneResizeHandle
      v-if="!compact"
      :label="t('paper.pdf.resize')"
      :hint="t('paper.pdf.resizeHint')"
      class="pointer-events-auto"
      @dragging="setDragging"
      @commit="commitWidths"
      @reset="resetPdf"
    />
    <SplitterPanel
      ref="pdfPanel"
      :order="1"
      :size-unit="compact ? '%' : 'px'"
      :default-size="compact ? 100 : pdfWidth"
      :min-size="compact ? 100 : MIN_PDF_PANE_WIDTH"
      :max-size="compact ? 100 : MAX_PDF_PANE_WIDTH"
      class="pointer-events-auto relative min-w-0"
    >
      <slot name="pdf" />
      <div v-if="dragging" class="absolute inset-0 z-20 cursor-col-resize" aria-hidden="true" />
    </SplitterPanel>
  </template>
  <template v-if="!expanded || !compact">
    <PaneResizeHandle
      v-if="!compact"
      :label="t('common.drawer.resize')"
      :hint="t('common.drawer.resizeHint')"
      class="pointer-events-auto"
      @dragging="setDragging"
      @commit="commitWidths"
      @reset="resetDetail"
    />
    <SplitterPanel
      ref="detailPanel"
      :order="2"
      :size-unit="compact ? '%' : 'px'"
      :default-size="compact ? 100 : ui.drawerWidth"
      :min-size="compact ? 100 : MIN_DRAWER_WIDTH"
      :max-size="compact ? 100 : MAX_DRAWER_WIDTH"
      class="pointer-events-auto min-w-0"
    >
      <slot />
    </SplitterPanel>
  </template>
</template>
