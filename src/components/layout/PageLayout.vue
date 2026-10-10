<script setup lang="ts">
import { SplitterGroup, SplitterPanel } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { MIN_PDF_PANE_WIDTH } from '@/composables/usePaperPdfPane'
import { useMediaQuery } from '@/composables/useMediaQuery'
import DrawerSplitPanels from './DrawerSplitPanels.vue'
import PageTopbar from './PageTopbar.vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    drawerOpen?: boolean
    drawerExpanded?: boolean
    drawerExpandedWidth?: number
    noPadding?: boolean
    fullWidth?: boolean
  }>(),
  {
    subtitle: '',
    drawerOpen: false,
    drawerExpanded: false,
    drawerExpandedWidth: 768,
    noPadding: false,
    fullWidth: false,
  },
)
const emit = defineEmits<{ closeDrawer: []; 'update:drawerExpandedWidth': [width: number] }>()
const ui = useUiStore()
const workspace = ref<HTMLElement | null>(null)
const availableWidth = ref(0)
let observer: ResizeObserver | null = null
onMounted(() => {
  const element = workspace.value
  if (!element) return
  availableWidth.value = element.clientWidth
  observer = new ResizeObserver(([entry]) => {
    if (entry) availableWidth.value = entry.contentRect.width
  })
  observer.observe(element)
})
onBeforeUnmount(() => observer?.disconnect())
// Dock whenever actual space fits the user's detail width, the minimum PDF
// width and 10% for the scrolling middle pane. Navigation resizing is included.
const floating = computed(
  () =>
    compact.value ||
    availableWidth.value * 0.9 < ui.drawerWidth + (props.drawerExpanded ? MIN_PDF_PANE_WIDTH : 0),
)
const compact = useMediaQuery('(max-width: 1023px)')
</script>

<template>
  <div ref="workspace" class="h-full max-w-full min-w-0 flex-1">
    <!-- All docked panes share the remaining workspace, not the browser width. -->
    <SplitterGroup direction="horizontal" :keyboard-resize-by="2" class="min-w-0">
      <SplitterPanel
        :order="0"
        :min-size="floating ? 0 : 10"
        class="workspace-content-scroll min-w-0"
      >
        <div class="workspace-content-canvas flex h-full flex-col">
          <PageTopbar :title="props.title" :subtitle="props.subtitle">
            <template v-if="$slots['topbar-title-suffix']" #title-suffix>
              <slot name="topbar-title-suffix" />
            </template>
            <template #actions><slot name="topbar-actions" /></template>
          </PageTopbar>
          <main
            id="app-main"
            class="min-w-0 flex-1 overflow-y-auto"
            :class="props.noPadding ? '' : 'px-4 py-6 lg:px-8'"
          >
            <div class="h-full w-full min-w-0"><slot /></div>
          </main>
        </div>
      </SplitterPanel>
      <DrawerSplitPanels
        v-if="drawerOpen && !floating"
        :expanded="drawerExpanded"
        :pdf-width="drawerExpandedWidth"
        :compact="false"
        @update:pdf-width="emit('update:drawerExpandedWidth', $event)"
      >
        <template #pdf><slot name="pdf" /></template>
        <slot name="drawer" />
      </DrawerSplitPanels>
    </SplitterGroup>

    <Teleport to="body">
      <div
        v-if="drawerOpen && floating"
        class="fixed inset-0 z-55 bg-black/30"
        @click="emit('closeDrawer')"
      />
      <div v-if="drawerOpen && floating" class="pointer-events-none fixed inset-0 z-60">
        <SplitterGroup direction="horizontal" :keyboard-resize-by="2">
          <SplitterPanel :order="0" :min-size="0" />
          <DrawerSplitPanels
            :expanded="drawerExpanded"
            :pdf-width="drawerExpandedWidth"
            :compact="compact"
            @update:pdf-width="emit('update:drawerExpandedWidth', $event)"
          >
            <template #pdf><slot name="pdf" /></template>
            <slot name="drawer" />
          </DrawerSplitPanels>
        </SplitterGroup>
      </div>
    </Teleport>
  </div>
</template>
