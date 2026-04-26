<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, BookOpenText } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { api } from '../../api/client'
import type { LibrarianHelpContent } from '../../constants/librarianHelp'
import { useNotify } from '../../composables/notify'
import { useLibrarianStore } from '../../stores/librarian'
import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'
import JsonPanel from '../JsonPanel.vue'
import PagerBar from '../../components/PagerBar.vue'
import SortButton from '../SortButton.vue'

const props = defineProps<{
  librarianHelp: LibrarianHelpContent
  embeddedProjectId?: string
}>()

const { t } = useI18n()
const notify = useNotify()
const store = useLibrarianStore()
const {
  globalFinderProjectId,
  globalFinderResult,
  globalFinderPapers,
  globalFinderTotal,
  globalFinderOffset,
  globalFinderLimit,
  globalFinderSortBy,
  globalFinderSortOrder,
  globalFinderTotalPages,
  globalFinderCurrentPage,
} = storeToRefs(store)

if (props.embeddedProjectId) {
  store.setGlobalFinderProjectId(props.embeddedProjectId)
}

const globalFinderYearStats = computed(() => globalFinderResult.value?.stats.year_distribution ?? null)

async function runGlobalFinder(): Promise<void> {
  try {
    globalFinderResult.value = await api.librarianGlobalFinder(globalFinderProjectId.value.trim())
    store.globalFinderSetPage(1) // reset to page 1
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
          <BarChart3 class="h-4 w-4" />
          <span>{{ t('librarian.globalFinder.title') }}</span>
        </div>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {{ t('librarian.globalFinder.projectId') }}
            </label>
            <input v-if="props.embeddedProjectId" :value="embeddedProjectId" disabled
              class="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400" />
            <input v-else v-model="globalFinderProjectId"
              :placeholder="t('librarian.globalFinder.projectIdPlaceholder')"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
          </div>
          <div class="flex items-center justify-between">
            <AppButton tone="sky" variant="solid" size="md" class="flex-1" @click="runGlobalFinder">
              <BarChart3 class="h-4 w-4" />
              <span>{{ t('librarian.globalFinder.run') }}</span>
            </AppButton>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
            <BookOpenText class="h-4 w-4" />
            <span>{{ t('librarian.help.supportedFields') }}</span>
          </div>
          <JsonPanel :title="t('librarian.help.supportedFields')" :value="props.librarianHelp.globalFinderSchema" />
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 text-sm font-semibold">{{ t('librarian.help.tips') }}</div>
          <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li v-for="tip in props.librarianHelp.globalFinderTips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div v-if="!globalFinderResult" class="text-sm text-slate-500 dark:text-slate-400">
        {{ t('librarian.globalFinder.empty') }}
      </div>
      <div v-else class="space-y-5">
        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
            <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.paperCount') }}</div>
            <div class="mt-1 text-lg font-semibold">{{ globalFinderResult.stats.paper_count }}</div>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
            <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.topTags') }}</div>
            <div class="mt-1 text-lg font-semibold">{{ globalFinderResult.stats.top_tags.length }}</div>
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div class="rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700">
              {{ t('librarian.globalFinder.yearStats') }}
            </div>
            <div v-if="globalFinderYearStats" class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.availableYears') }}
                </div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.available_count }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.missingYears') }}
                </div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.missing_count }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.mean') }}</div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.mean ?? '-' }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.variance') }}</div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.variance ?? '-' }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.median') }}</div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.median ?? '-' }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.modeYears') }}
                </div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.mode_years.join(', ') || '-' }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.q25') }}</div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.q25 ?? '-' }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.q75') }}</div>
                <div class="mt-1 font-semibold">{{ globalFinderYearStats.q75 ?? '-' }}</div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.globalFinder.outliers') }}</div>
                <div class="mt-1 font-semibold">
                  {{ globalFinderYearStats.outlier_count }}
                  <span class="text-xs text-slate-500 dark:text-slate-400">
                    ({{ t('librarian.globalFinder.lowOutliers') }} {{ globalFinderYearStats.low_outlier_count }} /
                    {{ t('librarian.globalFinder.highOutliers') }} {{ globalFinderYearStats.high_outlier_count }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700">
              {{ t('librarian.globalFinder.topTags') }}
            </div>
            <div v-if="globalFinderResult.stats.top_tags.length === 0"
              class="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
              {{ t('librarian.globalFinder.noTags') }}
            </div>
            <div v-else class="space-y-2 p-4">
              <div v-for="item in globalFinderResult.stats.top_tags" :key="item.tag"
                class="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <span>{{ item.tag }}</span>
                <span class="font-semibold">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700">
            {{ t('librarian.globalFinder.papers') }}
          </div>
          <div v-if="(globalFinderResult.papers || []).length === 0"
            class="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
            {{ t('librarian.globalFinder.noPapers') }}
          </div>
          <div v-else class="overflow-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  <th class="w-14 px-3 py-2">#</th>
                  <th class="px-3 py-2">paper_id</th>
                  <th class="px-3 py-2">
                    <SortButton :label="t('projectDetail.table.title')" :active="globalFinderSortBy === 'title'"
                      :order="globalFinderSortBy === 'title' ? globalFinderSortOrder : 'default'"
                      @click="store.globalFinderToggleSort('title')" />
                  </th>
                  <th class="px-3 py-2">{{ t('projectDetail.labels.authors') }}</th>
                  <th class="min-w-24 px-3 py-2">
                    <SortButton :label="t('projectDetail.labels.year')" :active="globalFinderSortBy === 'year'"
                      :order="globalFinderSortBy === 'year' ? globalFinderSortOrder : 'default'"
                      @click="store.globalFinderToggleSort('year')" />
                  </th>
                  <th class="w-24 px-3 py-2">
                    <SortButton :label="t('librarian.globalFinder.verdict')" :active="globalFinderSortBy === 'verdict'"
                      :order="globalFinderSortBy === 'verdict' ? globalFinderSortOrder : 'default'"
                      @click="store.globalFinderToggleSort('verdict')" />
                  </th>
                  <th class="w-32 px-3 py-2">{{ t('librarian.globalFinder.tags') }}</th>
                  <th class="min-w-24 px-3 py-2">{{ t('librarian.globalFinder.quickSummary') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="(paper, index) in globalFinderPapers" :key="paper.paper_id">
                  <td class="px-3 py-2 align-top text-xs text-slate-500 dark:text-slate-400">{{ globalFinderOffset +
                    index + 1 }}</td>
                  <td class="px-3 py-2 align-top">
                    <CopyableText :text="paper.paper_id" mono />
                  </td>
                  <td class="px-3 py-2 align-top">{{ paper.title ?? '-' }}</td>
                  <td class="max-w-52 px-3 py-2 align-top text-xs">
                    <div class="line-clamp-3">{{ paper.authors.join(', ') || '-' }}</div>
                  </td>
                  <td class="px-3 py-2 align-top">{{ paper.year ?? '-' }}</td>
                  <td class="px-3 py-2 align-top">{{ paper.quick_scan?.verdict ?? '-' }}</td>
                  <td class="px-3 py-2 align-top">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="tag in paper.quick_scan?.tags" :key="tag"
                        class="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                        {{ tag }}
                      </span>
                      <span v-if="!paper.quick_scan?.tags.length" class="text-xs text-slate-400">-</span>
                    </div>
                  </td>
                  <td class="min-w-24 px-3 py-2 align-top text-xs">{{ paper.quick_scan?.quick_summary ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-3">
          <PagerBar :current-page="globalFinderCurrentPage" :total-pages="globalFinderTotalPages"
            :total-count="globalFinderTotal" :rows-per-page="globalFinderLimit"
            @prev-page="store.globalFinderPrevPage()" @next-page="store.globalFinderNextPage()"
            @set-page="store.globalFinderSetPage" @set-limit="store.globalFinderSetLimit" />
        </div>

        <JsonPanel :title="t('librarian.help.rawJson')" :value="globalFinderResult" />
      </div>
    </section>
  </div>
</template>
