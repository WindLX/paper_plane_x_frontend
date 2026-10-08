<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PaperResponse } from '@/types/api'
import type { SortOrder, PaperSortKey } from '@/types/sort'
import { formatDateTime } from '@/utils/format'
import AppCheckbox from '../AppCheckbox.vue'
import AppTable from '../AppTable.vue'
import CopyableText from '../CopyableText.vue'
import SortButton from '../SortButton.vue'
import PaperStatusBadge from './PaperStatusBadge.vue'

const selectedPaperId = defineModel<string | null>('selectedPaperId')

const props = defineProps<{
  papers: PaperResponse[]
  offset: number
  sortBy: PaperSortKey
  sortOrder: SortOrder
  title?: string
  selectedIds: string[]
  selectionDisabled?: boolean
}>()

const emit = defineEmits<{
  sort: [field: PaperSortKey]
  open: [paperId: string]
  close: []
  'toggle-select': [paperId: string]
  'toggle-select-all': []
}>()

const { t } = useI18n()

const selectedIdSet = computed(() => new Set(props.selectedIds))
const pageIds = computed(() => props.papers.map((paper) => paper.paper_id))
const allSelected = computed(
  () => pageIds.value.length > 0 && pageIds.value.every((id) => selectedIdSet.value.has(id)),
)
const partiallySelected = computed(
  () => pageIds.value.some((id) => selectedIdSet.value.has(id)) && !allSelected.value,
)
const pageSelectionDisabled = computed(() => props.selectionDisabled || props.papers.length === 0)

function handleToggle(paperId: string): void {
  if (selectedPaperId.value === paperId) {
    selectedPaperId.value = null
    emit('close')
  } else {
    selectedPaperId.value = paperId
    emit('open', paperId)
  }
}
</script>

<template>
  <AppTable :title="props.title">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <table class="workspace-table">
      <thead>
        <tr class="text-ppx-text-muted text-left text-sm font-semibold tracking-tight uppercase">
          <th class="px-3 py-2">#</th>
          <th class="w-10 px-3 py-2">
            <AppCheckbox
              :checked="allSelected"
              :indeterminate="partiallySelected"
              :disabled="pageSelectionDisabled"
              :label="t('bulk.selectPage')"
              :checked-label="t('bulk.selectPageAll')"
              :indeterminate-label="t('bulk.selectPagePartial')"
              :disabled-label="t('bulk.selectPageDisabled')"
              @click.stop="emit('toggle-select-all')"
            />
          </th>
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
          <td class="px-3 py-2" @click.stop>
            <AppCheckbox
              :checked="selectedIdSet.has(paper.paper_id)"
              :disabled="props.selectionDisabled"
              :label="t('bulk.selectRow', { id: paper.paper_id })"
              :checked-label="t('bulk.selectRowSelected', { id: paper.paper_id })"
              :disabled-label="t('bulk.selectRowDisabled', { id: paper.paper_id })"
              @click.stop="emit('toggle-select', paper.paper_id)"
            />
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
              <PaperStatusBadge :status="paper.extraction_status" />
            </div>
            <div class="mb-1">
              <span class="text-ppx-text mr-1 font-medium"
                >{{ t('paper.rawPaperStatus.extractionFactCheck') }}:</span
              >
              <PaperStatusBadge :status="paper.extraction_fact_check_status" />
            </div>
            <div>
              <span class="text-ppx-text mr-1 font-medium"
                >{{ t('paper.rawPaperStatus.analysisFactCheck') }}:</span
              >
              <PaperStatusBadge :status="paper.analysis_fact_check_status" />
            </div>
          </td>
          <td class="px-3 py-2 text-sm">{{ formatDateTime(paper.created_at) }}</td>
          <td class="px-3 py-2 text-sm">{{ formatDateTime(paper.updated_at) }}</td>
        </tr>
        <tr v-if="props.papers.length === 0">
          <td colspan="8" class="workspace-table-empty text-center">
            {{ t('paper.noPapers') }}
          </td>
        </tr>
      </tbody>
    </table>
  </AppTable>
</template>
