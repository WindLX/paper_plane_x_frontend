<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import PagerBar from '@/components/PagerBar.vue'
import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import SimpleSearchBar from '@/components/SimpleSearchBar.vue'
import TaskListTable from '@/components/task/TaskListTable.vue'
import TaskQueueCards from '@/components/task/TaskQueueCards.vue'
import TaskDrawerContent from '@/components/task/TaskDrawerContent.vue'

import { useTaskList } from '@/composables/useTasksController'

import { useTasksWsStore } from '@/stores/tasksWs'

const { t } = useI18n()
const list = useTaskList()
const wsStore = useTasksWsStore()

const selectedTaskId = ref<string | null>(null)
const drawerOpen = ref(false)
const keyword = ref('')

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

/* ── Search Filter ── */
const filteredTasks = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return list.paginated.items
  }
  return list.paginated.items.filter((task) => {
    const haystacks = [task.task_id, task.paper_id, task.status, task.retry_of_task_id ?? '']
    return haystacks.some((item) => item.toLowerCase().includes(search))
  })
})

/* ── 选中项在过滤后失效时自动修正 ── */
watch(
  () => filteredTasks.value,
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
</script>

<template>
  <div class="h-full w-full">
    <PageLayout :title="t('tasks.title')" :subtitle="t('tasks.subtitle')" :drawer-open="drawerOpen">
      <section class="space-y-4">
        <TaskQueueCards
          :total="list.paginated.total"
          :queued="list.queued"
          :running="list.running"
          :completed="list.completed"
          :failed="list.failed"
          :canceled="list.canceled"
        />

        <SimpleSearchBar v-model="keyword" :placeholder="t('tasks.searchPlaceholder')" />

        <div :key="`${keyword}-${list.paginated.currentPage}`" class="animate-fade-in-up space-y-4">
          <TaskListTable
            v-model:selected-task-id="selectedTaskId"
            :tasks="filteredTasks"
            :offset="list.paginated.offset"
            :sort-order="list.paginated.sortOrder"
            :sort-by="list.paginated.sortBy"
            @sort="list.paginated.toggleSort"
            @open="openTaskDrawer"
            @close="closeTaskDrawer"
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
        <SlidePanel :title="t('tasks.detail.title')" @close="closeTaskDrawer">
          <TaskDrawerContent
            v-if="selectedTaskId"
            :task-id="selectedTaskId"
            @close="closeTaskDrawer"
            @list-refresh="list.fetchTasks()"
          />
        </SlidePanel>
      </template>
    </PageLayout>
  </div>
</template>
