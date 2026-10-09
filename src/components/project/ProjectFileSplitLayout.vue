<script setup lang="ts">
import { SplitterGroup, SplitterPanel } from 'reka-ui'
import { nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PaneResizeHandle from '@/components/layout/PaneResizeHandle.vue'
import {
  DEFAULT_FILE_TREE_WIDTH,
  MAX_FILE_TREE_WIDTH,
  MIN_FILE_TREE_WIDTH,
} from '@/utils/fileTreeWidth'

const props = defineProps<{
  desktop: boolean
  showTree: boolean
  treeWidth: number
}>()
const emit = defineEmits<{ commitWidth: [width: number] }>()
const { t } = useI18n()
const treePanel = ref<InstanceType<typeof SplitterPanel> | null>(null)

async function applyWidth(): Promise<void> {
  if (!props.desktop) return
  await nextTick()
  treePanel.value?.resize(props.treeWidth)
}
onMounted(applyWidth)

async function commitWidths(): Promise<void> {
  await nextTick()
  if (props.desktop && treePanel.value) emit('commitWidth', Math.round(treePanel.value.getSize()))
}
function setDragging(active: boolean): void {
  // Only a finished gesture updates the persisted preference.
  if (!active) void commitWidths()
}
function resetTree(): void {
  treePanel.value?.resize(DEFAULT_FILE_TREE_WIDTH)
  void commitWidths()
}
</script>

<template>
  <SplitterGroup
    v-if="desktop"
    direction="horizontal"
    :keyboard-resize-by="2"
    class="workspace-panel flex min-h-0 min-w-0 flex-1 overflow-hidden"
  >
    <SplitterPanel
      ref="treePanel"
      :order="0"
      size-unit="px"
      :default-size="treeWidth"
      :min-size="MIN_FILE_TREE_WIDTH"
      :max-size="MAX_FILE_TREE_WIDTH"
      class="flex min-h-0 min-w-0 overflow-hidden"
    >
      <slot name="tree" />
    </SplitterPanel>
    <PaneResizeHandle
      inset
      :label="t('projectFiles.treeResize')"
      :hint="t('projectFiles.treeResizeHint')"
      @dragging="setDragging"
      @commit="commitWidths"
      @reset="resetTree"
    />
    <SplitterPanel :order="1" class="flex min-h-0 min-w-0 overflow-hidden">
      <slot name="content" />
    </SplitterPanel>
  </SplitterGroup>
  <div v-else class="min-h-0 min-w-0 flex-1">
    <div v-show="showTree" class="h-full min-h-0 min-w-0">
      <slot name="tree" />
    </div>
    <div v-show="!showTree" class="h-full min-h-0 min-w-0">
      <slot name="content" />
    </div>
  </div>
</template>
