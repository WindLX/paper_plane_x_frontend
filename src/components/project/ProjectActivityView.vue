<script setup lang="ts">
import { nextTick, onMounted, ref, toRef, watch } from 'vue'
import { useTasksWsStore } from '@/stores/tasksWs'
import {
  AlertCircle,
  ListChecks,
  LoaderCircle,
  RefreshCw,
  Search,
  RotateCcw,
  Layers,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppSelect from '@/components/AppSelect.vue'
import AppDatePicker from '@/components/AppDatePicker.vue'
import AppTable from '@/components/AppTable.vue'
import { ACTIVITY_CATEGORY_ICONS, ACTIVITY_STATUS_ICONS } from '@/utils/activityAppearance'
import PagerBar from '@/components/PagerBar.vue'
import ProjectActivityRow from '@/components/project/activity/ProjectActivityRow.vue'
import { useProjectActivities } from '@/composables/useProjectActivities'
import type { ProjectActivityCategory, ProjectActivityStatus } from '@/types/api'

const props = defineProps<{
  projectId: string
  initialActivityId?: string | null
}>()

const emit = defineEmits<{
  openTask: [taskId: string]
  openTrace: [traceId: string]
  openPaper: [paperId: string]
  openFile: [filePath: string]
}>()

const { t } = useI18n()
const {
  items,
  total,
  limit,
  loading,
  error,
  filters,
  currentPage,
  totalPages,
  load,
  applyFilters,
  resetFilters,
  setPage,
  setLimit,
  nextPage,
  prevPage,
} = useProjectActivities(toRef(props, 'projectId'))

const feed = ref<HTMLElement | null>(null)
watch(
  () => [props.initialActivityId, items.value.length],
  async () => {
    if (!props.initialActivityId) return
    await nextTick()
    const row = feed.value?.querySelector(
      `[data-activity-id="${CSS.escape(props.initialActivityId)}"]`,
    )
    row?.scrollIntoView({ block: 'nearest' })
  },
  { immediate: true },
)

const CATEGORIES: ProjectActivityCategory[] = [
  'project',
  'paper',
  'file',
  'task',
  'agent',
  'export',
]
const STATUSES: ProjectActivityStatus[] = [
  'info',
  'queued',
  'running',
  'completed',
  'failed',
  'canceled',
]

onMounted(() => {
  void load(0)
})
const taskUpdates = useTasksWsStore()
watch(
  () => taskUpdates.lastUpdatedTask,
  () => {
    void load()
  },
)
</script>

<template>
  <section class="flex h-full min-h-0 w-full min-w-0 flex-col">
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" data-activity-scroll>
      <div
        class="workspace-panel grid grid-cols-2 items-end gap-3 p-4 md:grid-cols-4 xl:grid-cols-[minmax(96px,1fr)_minmax(96px,1fr)_minmax(124px,1fr)_minmax(124px,1fr)_minmax(140px,1.4fr)_auto]"
      >
        <div class="flex min-w-0 flex-col gap-1.5">
          <span class="text-ppx-text-soft text-xs font-medium">{{
            t('workbench.activity.filters.category')
          }}</span>
          <AppSelect
            v-model="filters.category"
            :aria-label="t('workbench.activity.filters.category')"
            :options="[
              { label: t('workbench.activity.filters.all'), value: null, icon: Layers },
              ...CATEGORIES.map((c) => ({
                label: t(`workbench.activity.categories.${c}`),
                value: c,
                icon: ACTIVITY_CATEGORY_ICONS[c],
              })),
            ]"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <span class="text-ppx-text-soft text-xs font-medium">{{
            t('workbench.activity.filters.status')
          }}</span>
          <AppSelect
            v-model="filters.status"
            :aria-label="t('workbench.activity.filters.status')"
            :options="[
              { label: t('workbench.activity.filters.all'), value: null, icon: Layers },
              ...STATUSES.map((s) => ({
                label: t(`workbench.activity.statuses.${s}`),
                value: s,
                icon: ACTIVITY_STATUS_ICONS[s],
              })),
            ]"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <span class="text-ppx-text-soft text-xs font-medium">{{
            t('workbench.activity.filters.from')
          }}</span>
          <AppDatePicker
            v-model="filters.created_at_from"
            :label="t('workbench.activity.filters.from')"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <span class="text-ppx-text-soft text-xs font-medium">{{
            t('workbench.activity.filters.to')
          }}</span>
          <AppDatePicker
            v-model="filters.created_at_to"
            :label="t('workbench.activity.filters.to')"
          />
        </div>
        <label class="col-span-2 flex min-w-0 flex-col gap-1.5 xl:col-span-1">
          <span class="text-ppx-text-soft text-xs font-medium">{{
            t('workbench.activity.filters.keyword')
          }}</span>
          <input
            v-model="filters.keyword"
            class="workspace-input"
            :placeholder="t('workbench.activity.filters.keywordPlaceholder')"
            @keydown.enter.prevent="applyFilters()"
          />
        </label>
        <div class="col-span-full flex items-center justify-end gap-2 xl:col-span-1">
          <AppButton size="sm" variant="solid" tone="sky" @click="applyFilters()">
            <Search class="h-4 w-4" />{{ t('workbench.activity.filters.apply') }}
          </AppButton>
          <AppButton size="sm" variant="outline" @click="resetFilters()">
            <RotateCcw class="h-4 w-4" />{{ t('workbench.activity.filters.reset') }}
          </AppButton>
        </div>
      </div>

      <div ref="feed">
        <AppTable :title="t('workbench.activity.title')" :aria-busy="loading" data-activity-table>
          <template #actions>
            <AppButton
              size="xs"
              :aria-label="t('actions.refresh')"
              :disabled="loading"
              @click="load()"
              ><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }"
            /></AppButton>
          </template>
          <table class="workspace-table w-full min-w-224">
            <thead>
              <tr>
                <th>{{ t('workbench.table.category') }}</th>
                <th>{{ t('workbench.table.event') }}</th>
                <th>{{ t('workbench.table.status') }}</th>
                <th>{{ t('workbench.table.time') }}</th>
                <th class="!text-right">{{ t('workbench.table.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="(loading && !items.length) || error || !items.length">
                <td colspan="5" class="workspace-table-empty !py-12">
                  <div
                    class="sticky left-3 flex min-h-28 w-[calc(100cqw-1.5rem)] flex-col items-center justify-center gap-3 text-center"
                    :role="error ? 'alert' : 'status'"
                  >
                    <LoaderCircle
                      v-if="loading && !items.length"
                      class="text-ppx-accent h-8 w-8 animate-spin"
                    />
                    <AlertCircle v-else-if="error" class="text-ppx-danger h-8 w-8" />
                    <ListChecks v-else class="text-ppx-text-muted h-8 w-8" />
                    <p class="text-ppx-text-soft text-sm">
                      {{
                        loading && !items.length
                          ? t('common.loading')
                          : error || t('workbench.activity.empty')
                      }}
                    </p>
                    <AppButton v-if="error" size="sm" variant="outline" @click="load()"
                      ><RefreshCw class="h-4 w-4" />{{ t('actions.retry') }}</AppButton
                    >
                  </div>
                </td>
              </tr>
              <ProjectActivityRow
                v-for="activity in items"
                v-else
                :key="activity.activity_id"
                :activity="activity"
                :default-expanded="activity.activity_id === props.initialActivityId"
                @open-task="emit('openTask', $event)"
                @open-trace="emit('openTrace', $event)"
                @open-paper="emit('openPaper', $event)"
                @open-file="emit('openFile', $event)"
              />
            </tbody>
          </table>
        </AppTable>
      </div>
      <PagerBar
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-count="total"
        :rows-per-page="limit"
        :rows-options="[10, 20, 50, 100]"
        @prev-page="prevPage()"
        @next-page="nextPage()"
        @set-page="setPage($event)"
        @set-limit="setLimit($event)"
      />
    </div>
  </section>
</template>
