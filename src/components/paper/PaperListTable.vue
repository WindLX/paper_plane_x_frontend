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
}>()

const emit = defineEmits<{
    sort: [field: PaperSortKey]
}>()

const { t } = useI18n()

function statusClass(status: string): string {
    const normalized = status.toUpperCase()
    if (normalized.includes('SUCCESS') || normalized.includes('COMPLETED')) {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
    }
    if (normalized.includes('FAIL') || normalized.includes('ERROR')) {
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
    }
    if (normalized.includes('RUNNING') || normalized.includes('PROCESSING')) {
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
    }
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
}

</script>

<template>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <th class="px-3 py-2">#</th>
                    <th class="px-3 py-2">{{ t('projectDetail.table.paperId') }}</th>
                    <th class="px-4 py-2">
                        <SortButton :label="t('projectDetail.table.title')" :active="sortBy === 'title'"
                            :order="sortBy === 'title' ? sortOrder : 'default'" @click="emit('sort', 'title')" />
                    </th>
                    <th class="px-2 py-2">{{ t('projectDetail.table.status') }}</th>
                    <th class="min-w-28 px-2 py-2">
                        <SortButton :label="t('projectDetail.table.created')" :active="sortBy === 'created_at'"
                            :order="sortBy === 'created_at' ? sortOrder : 'default'"
                            @click="emit('sort', 'created_at')" />
                    </th>
                    <th class="min-w-28 px-2 py-2">
                        <SortButton :label="t('projectDetail.table.updated')" :active="sortBy === 'updated_at'"
                            :order="sortBy === 'updated_at' ? sortOrder : 'default'"
                            @click="emit('sort', 'updated_at')" />
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="(paper, index) in papers" :key="paper.paper_id"
                    class="cursor-pointer align-top transition-colors hover:bg-sky-50/60 dark:hover:bg-slate-800/70"
                    :class="paper.paper_id === selectedPaperId ? 'bg-sky-50 dark:bg-sky-900/20' : ''"
                    @click="selectedPaperId = paper.paper_id">
                    <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{{ (offset ?? 0) + index + 1 }}
                    </td>
                    <td class="px-3 py-2">
                        <CopyableText :text="paper.paper_id" mono />
                    </td>
                    <td class="px-3 py-2">
                        <div class="max-w-70 warp-break-word text-sm text-slate-700 dark:text-slate-200">{{ paper.title
                            ?? '-' }}
                        </div>
                    </td>
                    <td class="px-3 py-2 text-xs">
                        <div class="mb-1">
                            <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">{{
                                t('projectDetail.rawPaperStatus.extraction') }}:</span>
                            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                                :class="statusClass(paper.extraction_status)">
                                {{ paper.extraction_status }}
                            </span>
                        </div>
                        <div class="mb-1">
                            <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">{{
                                t('projectDetail.rawPaperStatus.extractionFactCheck') }}:</span>
                            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                                :class="statusClass(paper.extraction_fact_check_status)">
                                {{ paper.extraction_fact_check_status }}
                            </span>
                        </div>
                        <div>
                            <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">{{
                                t('projectDetail.rawPaperStatus.analysisFactCheck') }}:</span>
                            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                                :class="statusClass(paper.analysis_fact_check_status)">
                                {{ paper.analysis_fact_check_status }}
                            </span>
                        </div>
                    </td>
                    <td class="px-3 py-2 text-xs">{{ formatDateTime(paper.created_at) }}</td>
                    <td class="px-3 py-2 text-xs">{{ formatDateTime(paper.updated_at) }}</td>
                </tr>
                <tr v-if="papers.length === 0">
                    <td colspan="6" class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{{
                        t('projectDetail.noPapers') }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
