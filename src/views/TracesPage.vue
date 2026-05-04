<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import SimpleSearchBar from '@/components/SimpleSearchBar.vue'
import TraceListTable from '@/components/trace/TraceListTable.vue'
import TraceSummaryCards from '@/components/trace/TraceSummaryCards.vue'
import { useNotify } from '@/composables/useNotify'
import { useTraceStore } from '@/stores/traces'
import { useUiStore } from '@/stores/ui'

const traceStore = useTraceStore()
const notify = useNotify()
const uiStore = useUiStore()
const { t } = useI18n()
const lastErrorNotified = ref<string | null>(null)
const keyword = ref('')
const selectedTraceId = ref<string | null>(null)

const filteredTraces = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return traceStore.items
  }
  return traceStore.items.filter((trace) => {
    const haystacks = [trace.trace_id, trace.agent_name, trace.llm_model ?? '']
    return haystacks.some((item) => item.toLowerCase().includes(search))
  })
})

onMounted(async () => {
  await traceStore.fetchTraces({ offset: 0, limit: 20 })
})

watch(
  () => traceStore.error,
  (error) => {
    if (!error) {
      lastErrorNotified.value = null
      return
    }
    if (lastErrorNotified.value === error) {
      return
    }
    notify.push(error, 'error', 3600)
    lastErrorNotified.value = error
  },
)

watch(
  () => uiStore.rightDrawerOpen,
  (isOpen) => {
    if (!isOpen) {
      selectedTraceId.value = null
    }
  },
)

function openTraceDrawer(traceId: string): void {
  uiStore.openRightDrawer('trace', { traceId }, 'local')
}

function closeTraceDrawer(): void {
  uiStore.closeRightDrawer()
}
</script>

<template>
  <section class="space-y-4">
    <TraceSummaryCards :stats="traceStore.stats" :total="traceStore.total" />

    <section class="workspace-panel p-3">
      <SimpleSearchBar v-model="keyword" :placeholder="t('traces.searchPlaceholder')" />
    </section>

    <div :key="`${keyword}-${traceStore.currentPage}`" class="animate-fade-in-up space-y-4">
      <TraceListTable
        v-model:selected-trace-id="selectedTraceId"
        :traces="filteredTraces"
        :offset="traceStore.offset"
        :sort-order="traceStore.sortOrder"
        :sort-by="traceStore.sortBy"
        @sort="traceStore.toggleSort"
        @open="openTraceDrawer"
        @close="closeTraceDrawer"
      />

      <PagerBar
        :current-page="traceStore.currentPage"
        :total-pages="traceStore.totalPages"
        :total-count="traceStore.total"
        :rows-per-page="traceStore.limit"
        @prev-page="traceStore.prevPage()"
        @next-page="traceStore.nextPage()"
        @set-page="traceStore.setPage"
        @set-limit="traceStore.setLimit"
      />
    </div>
  </section>
</template>
