<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { SplitterPanel } from 'reka-ui'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'
import { DEFAULT_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from '@/utils/sidebarWidth'
import PaneResizeHandle from '../layout/PaneResizeHandle.vue'
import AppSidebar from './AppSidebar.vue'

const ui = useUiStore()
const { t } = useI18n()
const panel = ref<InstanceType<typeof SplitterPanel> | null>(null)
async function commitWidth(): Promise<void> {
  await nextTick()
  if (panel.value && !ui.sidebarCollapsed) ui.setSidebarWidth(panel.value.getSize())
}
function resetWidth(): void {
  panel.value?.resize(DEFAULT_SIDEBAR_WIDTH)
  void commitWidth()
}
watch(
  () => ui.sidebarCollapsed,
  async (collapsed) => {
    await nextTick()
    panel.value?.resize(collapsed ? 60 : ui.sidebarWidth)
  },
)
</script>

<template>
  <SplitterPanel
    ref="panel"
    :order="0"
    size-unit="px"
    :default-size="ui.sidebarCollapsed ? 60 : ui.sidebarWidth"
    :min-size="ui.sidebarCollapsed ? 60 : MIN_SIDEBAR_WIDTH"
    :max-size="ui.sidebarCollapsed ? 60 : MAX_SIDEBAR_WIDTH"
    class="min-w-0"
  >
    <AppSidebar :collapsed="ui.sidebarCollapsed" />
  </SplitterPanel>
  <PaneResizeHandle
    v-if="!ui.sidebarCollapsed"
    :label="t('common.sidebar.resize')"
    :hint="t('common.drawer.resizeHint')"
    @dragging="!$event && commitWidth()"
    @commit="commitWidth"
    @reset="resetWidth"
  />
</template>
