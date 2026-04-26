<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, ArrowRightToLine } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    totalCount: number
    rowsPerPage: number
    rowsOptions?: number[]
  }>(),
  {
    rowsOptions: () => [10, 20, 50, 100],
  },
)

const emit = defineEmits<{
  'prev-page': []
  'next-page': []
  'set-page': [page: number]
  'set-limit': [limit: number]
}>()

const { t } = useI18n()
const jumpInput = ref(String(props.currentPage))

watch(
  () => props.currentPage,
  (value) => {
    jumpInput.value = String(value)
  },
)

const hasPrevPage = computed(() => props.currentPage > 1)
const hasNextPage = computed(() => props.currentPage < props.totalPages)

function jumpToPage(): void {
  const parsed = Number.parseInt(jumpInput.value, 10)
  if (!Number.isFinite(parsed)) return
  emit('set-page', parsed)
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
    <div class="text-slate-600 dark:text-slate-300">
      {{ t('common.pageSummary', { current: currentPage, total: totalPages, count: totalCount }) }}
    </div>
    <div class="flex items-center gap-2">
      <label class="text-xs text-slate-500 dark:text-slate-400">{{ t('common.rows') }}</label>
      <select
        class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
        :value="rowsPerPage" @change="emit('set-limit', Number(($event.target as HTMLSelectElement).value))">
        <option v-for="option in rowsOptions" :key="option" :value="option">{{ option }}</option>
      </select>
      <AppButton size="xs" :disabled="!hasPrevPage" @click="emit('prev-page')">
        <ChevronLeft class="h-3.5 w-3.5" />
        <span>{{ t('actions.prev') }}</span>
      </AppButton>
      <AppButton size="xs" :disabled="!hasNextPage" @click="emit('next-page')">
        <span>{{ t('actions.next') }}</span>
        <ChevronRight class="h-3.5 w-3.5" />
      </AppButton>
      <div class="ml-1 inline-flex items-center gap-1.5">
        <input v-model="jumpInput" type="number" min="1" :max="totalPages" :placeholder="t('common.page')"
          class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
          @keydown.enter.prevent="jumpToPage" />
        <AppButton size="xs" @click="jumpToPage">
          <ArrowRightToLine class="h-3.5 w-3.5" />
          <span>{{ t('actions.go') }}</span>
        </AppButton>
      </div>
    </div>
  </div>
</template>
