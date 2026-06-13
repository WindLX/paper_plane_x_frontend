<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import SimpleSearchBar from '@/components/SimpleSearchBar.vue'
import TraceDrawerContent from '@/components/trace/TraceDrawerContent.vue'
import TraceListTable from '@/components/trace/TraceListTable.vue'
import TraceSummaryCards from '@/components/trace/TraceSummaryCards.vue'
import { useTraceList } from '@/composables/useTracesController'
import { useTasksWsStore } from '@/stores/tasksWs'

const { t } = useI18n()
const list = useTraceList()
const wsStore = useTasksWsStore()
const keyword = ref('')
const selectedTraceId = ref<string | null>(null)

/* ── Drawer state ─────────────────────────────────────────────── */
const drawerOpen = ref(false)

async function openTraceDrawer(traceId: string): Promise<void> {
  drawerOpen.value = true
  await nextTick()
  selectedTraceId.value = traceId
}

function closeTraceDrawer(): void {
  drawerOpen.value = false
}

watch(drawerOpen, (isOpen) => {
  if (!isOpen) {
    selectedTraceId.value = null
  }
})

// Search Filter

const filteredTraces = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return list.paginated.items
  }
  return list.paginated.items.filter((trace) => {
    const haystacks = [trace.trace_id, trace.agent_name, trace.llm_model ?? '']
    return haystacks.some((item) => item.toLowerCase().includes(search))
  })
})

watch(
  () => filteredTraces.value,
  (items, oldItems) => {
    if (items.length === 0) {
      selectedTraceId.value = null
      return
    }
    if (!oldItems || oldItems.length === 0) return
    if (!selectedTraceId.value) return
    const exists = items.some((trace) => trace.trace_id === selectedTraceId.value)
    if (!exists) {
      selectedTraceId.value = items[0].trace_id
    }
  },
)

/* ── WebSocket 刷新 ── */
watch(
  () => wsStore.lastUpdatedTask,
  () => {
    void list.fetchTraces()
  },
)

onMounted(async () => {
  await list.fetchTraces({ offset: 0, limit: 20 })
})
</script>

<template>
  <div class="h-full w-full">
    <PageLayout
      :title="t('traces.title')"
      :subtitle="t('traces.subtitle')"
      :drawer-open="drawerOpen"
      @close-drawer="closeTraceDrawer"
    >
      <section class="space-y-4">
        <TraceSummaryCards :stats="list.stats" :total="list.paginated.total" />

        <SimpleSearchBar v-model="keyword" :placeholder="t('traces.searchPlaceholder')" />

        <div :key="`${keyword}-${list.paginated.currentPage}`" class="animate-fade-in-up space-y-4">
          <TraceListTable
            v-model:selected-trace-id="selectedTraceId"
            :traces="filteredTraces"
            :offset="list.paginated.offset"
            :sort-order="list.paginated.sortOrder"
            :sort-by="list.paginated.sortBy"
            @sort="list.paginated.toggleSort"
            @open="openTraceDrawer"
            @close="closeTraceDrawer"
          />

          <PagerBar
            :current-page="list.paginated.currentPage"
            :total-pages="list.paginated.totalPages"
            :total-count="list.paginated.total"
            :rows-per-page="list.paginated.limit"
            @prev-page="list.paginated.prevPage()"
            @next-page="list.paginated.nextPage()"
            @set-page="list.paginated.setPage"
            @set-limit="list.paginated.setLimit"
          />
        </div>
      </section>

      <template #drawer>
        <SlidePanel :title="t('traces.detail.title')" @close="closeTraceDrawer">
          <TraceDrawerContent
            v-if="selectedTraceId"
            :trace-id="selectedTraceId"
            @close="closeTraceDrawer"
            @list-refresh="list.fetchTraces()"
          />
        </SlidePanel>
      </template>
    </PageLayout>
  </div>
</template>
