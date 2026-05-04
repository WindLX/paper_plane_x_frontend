<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, ArrowRightToLine } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import AppSelect from './AppSelect.vue'

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
  <div class="workspace-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
    <div class="workspace-body">
      {{ t('common.pageSummary', { current: currentPage, total: totalPages, count: totalCount }) }}
    </div>
    <div class="flex items-center gap-2">
      <label class="workspace-muted text-xs">{{ t('common.rows') }}</label>
      <AppSelect
        :model-value="rowsPerPage"
        :options="rowsOptions.map((o) => ({ label: String(o), value: o }))"
        size="sm"
        class="w-auto"
        @update:model-value="$event != null && emit('set-limit', $event)"
      />
      <AppButton size="xs" :disabled="!hasPrevPage" @click="emit('prev-page')">
        <ChevronLeft class="h-3.5 w-3.5" />
        <span>{{ t('actions.prev') }}</span>
      </AppButton>
      <AppButton size="xs" :disabled="!hasNextPage" @click="emit('next-page')">
        <span>{{ t('actions.next') }}</span>
        <ChevronRight class="h-3.5 w-3.5" />
      </AppButton>
      <div class="ml-1 inline-flex items-center gap-1.5">
        <input
          v-model="jumpInput"
          type="number"
          min="1"
          :max="totalPages"
          :placeholder="t('common.page')"
          class="workspace-input w-16 px-2 py-1 text-xs"
          @keydown.enter.prevent="jumpToPage"
        />
        <AppButton size="xs" @click="jumpToPage">
          <ArrowRightToLine class="h-3.5 w-3.5" />
          <span>{{ t('actions.go') }}</span>
        </AppButton>
      </div>
    </div>
  </div>
</template>
