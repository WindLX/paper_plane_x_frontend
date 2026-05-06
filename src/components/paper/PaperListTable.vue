<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { PaperResponse } from '../../types/api'
import type { SortOrder, PaperSortKey } from '../../types/sort'
import { formatDateTime } from '../../utils/format'
import CopyableText from '../CopyableText.vue'
import SortButton from '../SortButton.vue'

const selectedPaperId = defineModel<string | null>('selectedPaperId')

const props = defineProps<{
  papers: PaperResponse[]
  offset: number
  sortBy: PaperSortKey
  sortOrder: SortOrder
  title?: string
}>()

const emit = defineEmits<{
  sort: [field: PaperSortKey]
  open: [paperId: string]
  close: []
}>()

const { t } = useI18n()

function handleToggle(paperId: string): void {
  if (selectedPaperId.value === paperId) {
    selectedPaperId.value = null
    emit('close')
  } else {
    selectedPaperId.value = paperId
    emit('open', paperId)
  }
}

function statusClass(status: string | null | undefined): string {
  const normalized = (status ?? '').toUpperCase()

  // Success states: COMPLETED, HUMAN_COMPLETED, PASSED, HUMAN_PASSED
  if (
    normalized.includes('COMPLETED') ||
    normalized.includes('HUMAN_COMPLETED') ||
    normalized.includes('PASSED') ||
    normalized.includes('HUMAN_PASSED')
  ) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  }

  // Failure states: FAILED, FAIL, ERROR
  if (
    normalized.includes('FAILED') ||
    normalized.includes('FAIL') ||
    normalized.includes('ERROR')
  ) {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
  }

  // In-progress states: PROCESSING, RUNNING
  if (normalized.includes('PROCESSING') || normalized.includes('RUNNING')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  }

  // Pending / unknown -> neutral
  if (normalized.includes('PENDING') || normalized === '') {
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
  }

  // Fallback
  return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
}
</script>

<template>
  <section class="workspace-table-shell">
    <div v-if="props.title" class="border-ppx-border border-b px-4 py-3">
      <h3 class="text-ppx-text text-xl font-semibold tracking-tight">
        {{ props.title }}
      </h3>
    </div>
    <table class="workspace-table">
      <thead>
        <tr class="text-ppx-text-muted text-left text-sm font-semibold tracking-tight uppercase">
          <th class="px-3 py-2">#</th>
          <th class="px-3 py-2">
            <SortButton
              :label="t('paper.table.title')"
              :active="props.sortBy === 'title'"
              :order="props.sortBy === 'title' ? props.sortOrder : 'default'"
              @click="emit('sort', 'title')"
            />
          </th>
          <th class="px-3 py-2">{{ t('paper.table.authors') }}</th>
          <th class="px-3 py-2">{{ t('paper.table.year') }}</th>
          <th class="px-2 py-2">{{ t('paper.table.status') }}</th>
          <th class="min-w-28 px-2 py-2">
            <SortButton
              :label="t('paper.table.created')"
              :active="props.sortBy === 'created_at'"
              :order="props.sortBy === 'created_at' ? props.sortOrder : 'default'"
              @click="emit('sort', 'created_at')"
            />
          </th>
          <th class="min-w-28 px-2 py-2">
            <SortButton
              :label="t('paper.table.updated')"
              :active="props.sortBy === 'updated_at'"
              :order="props.sortBy === 'updated_at' ? props.sortOrder : 'default'"
              @click="emit('sort', 'updated_at')"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(paper, index) in props.papers"
          :key="paper.paper_id"
          class="workspace-row-hover cursor-pointer align-top"
          :class="paper.paper_id === selectedPaperId ? 'workspace-row-selected' : ''"
          @click="handleToggle(paper.paper_id)"
        >
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ (props.offset ?? 0) + index + 1 }}
          </td>
          <td class="px-3 py-2">
            <div class="mt-1 max-w-80 text-sm font-medium wrap-break-word">
              {{ paper.title ?? '-' }}
            </div>
            <div class="mt-1">
              <CopyableText :text="paper.paper_id" mono />
            </div>
          </td>
          <td class="px-3 py-2 text-sm">
            <div class="line-clamp-2 max-w-48">
              {{ paper.authors?.length ? paper.authors.join(', ') : '-' }}
            </div>
          </td>
          <td class="workspace-muted px-3 py-2 text-sm tabular-nums">
            {{ paper.year ?? '-' }}
          </td>
          <td class="px-3 py-2 text-sm">
            <div class="mb-1">
              <span class="text-ppx-text mr-1 font-medium"
                >{{ t('paper.rawPaperStatus.extraction') }}:</span
              >
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="statusClass(paper.extraction_status)"
              >
                {{ paper.extraction_status }}
              </span>
            </div>
            <div class="mb-1">
              <span class="text-ppx-text mr-1 font-medium"
                >{{ t('paper.rawPaperStatus.extractionFactCheck') }}:</span
              >
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="statusClass(paper.extraction_fact_check_status)"
              >
                {{ paper.extraction_fact_check_status }}
              </span>
            </div>
            <div>
              <span class="text-ppx-text mr-1 font-medium"
                >{{ t('paper.rawPaperStatus.analysisFactCheck') }}:</span
              >
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="statusClass(paper.analysis_fact_check_status)"
              >
                {{ paper.analysis_fact_check_status }}
              </span>
            </div>
          </td>
          <td class="px-3 py-2 text-sm">{{ formatDateTime(paper.created_at) }}</td>
          <td class="px-3 py-2 text-sm">{{ formatDateTime(paper.updated_at) }}</td>
        </tr>
        <tr v-if="props.papers.length === 0">
          <td colspan="7" class="workspace-table-empty text-center">
            {{ t('paper.noPapers') }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
