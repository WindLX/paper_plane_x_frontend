<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RotateCcw, Trash2, XCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import AppButton from '@/components/AppButton.vue'
import BulkActionBar from '@/components/bulk/BulkActionBar.vue'
import BulkConfirmModal from '@/components/bulk/BulkConfirmModal.vue'
import BulkResultPanel from '@/components/bulk/BulkResultPanel.vue'
import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import SimpleSearchBar from '@/components/SimpleSearchBar.vue'
import TaskListTable from '@/components/task/TaskListTable.vue'
import TaskQueueCards from '@/components/task/TaskQueueCards.vue'
import TaskDrawerContent from '@/components/task/TaskDrawerContent.vue'

import { useTaskList } from '@/composables/useTasksController'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { useNotify } from '@/composables/useNotify'
import { useTaskBulkActions, type TaskBulkAction } from '@/composables/useTaskBulkActions'

import { useTasksWsStore } from '@/stores/tasksWs'

const { t } = useI18n()
const list = useTaskList()
const notify = useNotify()
const wsStore = useTasksWsStore()

const selectedTaskId = ref<string | null>(null)
const drawerOpen = ref(false)
const detailReloadKey = ref(0)
const keyword = ref('')
let pageAlive = true

/* ── Bulk selection ───────────────────────────────────────────── */

const selection = useBulkSelection(computed(() => list.searchKeyword))
const bulk = useTaskBulkActions()
const pendingAction = ref<TaskBulkAction | null>(null)
const pendingIds = ref<string[]>([])

const bulkActionMeta: Record<
  TaskBulkAction,
  { label: string; title: string; message: string; tone: 'default' | 'danger' }
> = {
  cancel: {
    label: 'bulk.actions.cancel',
    title: 'bulk.tasks.cancelTitle',
    message: 'bulk.tasks.cancelMessage',
    tone: 'default',
  },
  retry: {
    label: 'bulk.actions.retry',
    title: 'bulk.tasks.retryTitle',
    message: 'bulk.tasks.retryMessage',
    tone: 'default',
  },
  delete: {
    label: 'bulk.actions.delete',
    title: 'bulk.tasks.deleteTitle',
    message: 'bulk.tasks.deleteMessage',
    tone: 'danger',
  },
}

const confirmMeta = computed(() =>
  pendingAction.value ? bulkActionMeta[pendingAction.value] : null,
)

function requestBulkAction(action: TaskBulkAction): void {
  if (bulk.running || selection.count === 0) return
  pendingIds.value = [...selection.selectedIds]
  pendingAction.value = action
}

function cancelBulkAction(): void {
  if (bulk.running) return
  pendingAction.value = null
  pendingIds.value = []
}

function summarize(entries: Array<{ status: string }>): {
  success: number
  failed: number
  skipped: number
} {
  return {
    success: entries.filter((entry) => entry.status === 'success').length,
    failed: entries.filter((entry) => entry.status === 'failed').length,
    skipped: entries.filter((entry) => entry.status === 'skipped').length,
  }
}

async function refreshTasksAfterBulk(): Promise<void> {
  await list.fetchTasks()
  if (list.paginated.items.length === 0 && list.paginated.offset > 0) {
    await list.fetchTasks({
      offset: Math.max(0, list.paginated.offset - list.paginated.limit),
      limit: list.paginated.limit,
    })
  }
}

async function confirmBulkAction(): Promise<void> {
  const action = pendingAction.value
  const taskIds = [...pendingIds.value]
  if (!action || taskIds.length === 0) return

  const outcome = await bulk.execute(action, taskIds)
  if (!pageAlive) return
  pendingAction.value = null
  pendingIds.value = []

  if (!outcome) {
    notify.push(t('bulk.errors.busy'), 'warning', 3200)
    return
  }

  const succeeded = outcome.filter((entry) => entry.status === 'success').map((entry) => entry.item)
  selection.unselectMany(succeeded)
  if (selectedTaskId.value && succeeded.includes(selectedTaskId.value)) {
    detailReloadKey.value += 1
  }
  await refreshTasksAfterBulk()

  if (!pageAlive) return
  const counts = summarize(outcome)
  notify.push(
    t('bulk.notifications.completed', counts),
    counts.failed > 0 ? 'warning' : 'success',
    4200,
  )
}
let searchTimer: ReturnType<typeof setTimeout> | null = null
const queueTotal = computed(
  () => list.queued + list.running + list.completed + list.failed + list.canceled,
)

/* ── Drawer Control ───────────────────────────────────────────── */

async function openTaskDrawer(taskId: string): Promise<void> {
  drawerOpen.value = true
  await nextTick()
  selectedTaskId.value = taskId
}

function closeTaskDrawer(): void {
  drawerOpen.value = false
}

// Drawer 关闭时清理 taskId（也可以保留做下次打开缓存）
watch(drawerOpen, (isOpen) => {
  if (!isOpen) selectedTaskId.value = null
})

async function submitSearch(): Promise<void> {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  list.searchKeyword = keyword.value.trim()
  await list.fetchTasks({ offset: 0, limit: list.paginated.limit })
}

watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchTimer = null
    void submitSearch()
  }, 300)
})

/* ── 选中项在过滤后失效时自动修正 ── */
watch(
  () => list.paginated.items,
  (items, oldItems) => {
    if (items.length === 0) {
      selectedTaskId.value = null
      return
    }
    if (!oldItems || oldItems.length === 0) return
    if (!selectedTaskId.value) return
    const exists = items.some((task) => task.task_id === selectedTaskId.value)
    if (!exists) {
      selectedTaskId.value = items[0].task_id
    }
  },
)

/* ── WebSocket 刷新 ── */
watch(
  () => wsStore.lastUpdatedTask,
  () => list.fetchTasks(),
)

onMounted(async () => {
  wsStore.connect()
  await list.fetchTasks({ offset: 0, limit: list.paginated.limit })
})

onBeforeUnmount(() => {
  pageAlive = false
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="h-full w-full">
    <PageLayout
      :title="t('tasks.title')"
      :subtitle="t('tasks.subtitle')"
      :drawer-open="drawerOpen"
      @close-drawer="closeTaskDrawer"
    >
      <section class="space-y-4">
        <TaskQueueCards
          :total="queueTotal"
          :queued="list.queued"
          :running="list.running"
          :completed="list.completed"
          :failed="list.failed"
          :canceled="list.canceled"
        />

        <SimpleSearchBar
          v-model="keyword"
          :placeholder="t('tasks.searchPlaceholder')"
          @submit="submitSearch"
        />

        <BulkResultPanel v-if="bulk.rows.length > 0" :rows="bulk.rows" @close="bulk.clearResults" />

        <div :key="`${keyword}-${list.paginated.currentPage}`" class="animate-fade-in-up space-y-4">
          <TaskListTable
            v-model:selected-task-id="selectedTaskId"
            :tasks="list.paginated.items"
            :offset="list.paginated.offset"
            :sort-order="list.paginated.sortOrder"
            :sort-by="list.paginated.sortBy"
            :selected-ids="selection.selectedIds"
            :selection-disabled="bulk.running"
            @sort="list.paginated.toggleSort"
            @toggle-select="selection.toggle"
            @toggle-select-all="
              selection.toggleAll(list.paginated.items.map((task) => task.task_id))
            "
            @open="openTaskDrawer"
            @close="closeTaskDrawer"
          >
            <template v-if="selection.count > 0" #actions>
              <BulkActionBar :count="selection.count" :busy="bulk.running" @clear="selection.clear">
                <AppButton
                  size="xs"
                  variant="outline"
                  :disabled="bulk.running"
                  @click="requestBulkAction('cancel')"
                >
                  <XCircle class="h-3.5 w-3.5" />
                  <span>{{ t('bulk.actions.cancel') }}</span>
                </AppButton>
                <AppButton
                  size="xs"
                  variant="outline"
                  :disabled="bulk.running"
                  @click="requestBulkAction('retry')"
                >
                  <RotateCcw class="h-3.5 w-3.5" />
                  <span>{{ t('bulk.actions.retry') }}</span>
                </AppButton>
                <AppButton
                  size="xs"
                  variant="outline"
                  tone="rose"
                  :disabled="bulk.running"
                  @click="requestBulkAction('delete')"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  <span>{{ t('bulk.actions.delete') }}</span>
                </AppButton>
              </BulkActionBar>
            </template>
          </TaskListTable>

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
        <SlidePanel :title="t('tasks.detail.title')" @close="closeTaskDrawer">
          <TaskDrawerContent
            v-if="selectedTaskId"
            :key="detailReloadKey"
            :task-id="selectedTaskId"
            @close="closeTaskDrawer"
            @list-refresh="list.fetchTasks()"
          />
        </SlidePanel>
      </template>
    </PageLayout>

    <BulkConfirmModal
      :open="pendingAction !== null"
      :title="confirmMeta ? t(confirmMeta.title) : ''"
      :message="confirmMeta ? t(confirmMeta.message, { count: pendingIds.length }) : ''"
      :items="pendingIds"
      :confirm-label="confirmMeta ? t(confirmMeta.label) : ''"
      :tone="confirmMeta?.tone ?? 'default'"
      :busy="bulk.running"
      @confirm="confirmBulkAction"
      @close="cancelBulkAction"
    />
  </div>
</template>
