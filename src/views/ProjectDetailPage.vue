<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDownUp, ArrowDownWideNarrow, ArrowLeft, ArrowUpWideNarrow, ChevronLeft, ChevronRight, Eye, Unlink2 } from 'lucide-vue-next'
import { useRoute, RouterLink } from 'vue-router'

import AppButton from '../components/AppButton.vue'
import CopyableText from '../components/CopyableText.vue'
import JsonPanel from '../components/JsonPanel.vue'
import { useTriSort } from '../composables/triSort'
import { useProjectStore } from '../stores/projects'
import type { PaperResponse } from '../types/api'
import { formatDateTime } from '../utils/format'

const route = useRoute()
const projectStore = useProjectStore()
const projectId = computed(() => String(route.params.projectId ?? ''))
const unlinkingPaperId = ref<string | null>(null)
const selectedPaperId = ref<string | null>(null)
const jumpPaperPageInput = ref('')
const { sortField: paperSortField, sortOrder: paperSortOrder, toggleSort: togglePaperSort } =
  useTriSort<'created' | 'updated'>()

onMounted(async () => {
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }
  await projectStore.fetchProjectPapers(projectId.value)
})

const project = computed(() =>
  projectStore.projects.find((item) => item.project_id === projectId.value),
)

const papers = computed(() => projectStore.papersByProject[projectId.value] ?? [])
const paperPage = computed(() => projectStore.paperPagination(projectId.value))
const paperCurrentPage = computed(
  () => Math.floor(paperPage.value.offset / paperPage.value.limit) + 1,
)
const paperTotalPages = computed(() => {
  if (paperPage.value.limit <= 0) return 1
  return Math.max(1, Math.ceil(paperPage.value.total / paperPage.value.limit))
})
const hasPrevPaperPage = computed(() => paperPage.value.offset > 0)
const hasNextPaperPage = computed(
  () => paperPage.value.offset + paperPage.value.limit < paperPage.value.total,
)

const selectedPaper = computed<PaperResponse | null>(() => {
  if (!selectedPaperId.value) {
    return null
  }
  return papers.value.find((paper) => paper.paper_id === selectedPaperId.value) ?? null
})

const sortedPapers = computed(() => {
  const items = [...papers.value]
  if (paperSortField.value === 'none' || paperSortOrder.value === 'default') {
    return items
  }
  const key = paperSortField.value === 'created' ? 'created_at' : 'updated_at'
  items.sort((a, b) => {
    const av = new Date(a[key] ?? 0).getTime()
    const bv = new Date(b[key] ?? 0).getTime()
    return paperSortOrder.value === 'asc' ? av - bv : bv - av
  })
  return items
})

watch(
  papers,
  (items) => {
    if (items.length === 0) {
      selectedPaperId.value = null
      return
    }
    const exists = items.some((paper) => paper.paper_id === selectedPaperId.value)
    if (!exists) {
      selectedPaperId.value = items[0].paper_id
    }
  },
  { immediate: true },
)

async function unlinkPaper(paperId: string): Promise<void> {
  unlinkingPaperId.value = paperId
  try {
    await projectStore.unlinkProjectPaper(projectId.value, paperId)
  } finally {
    unlinkingPaperId.value = null
  }
}

function selectPaper(paper: PaperResponse): void {
  selectedPaperId.value = paper.paper_id
}

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

async function jumpToPaperPage(): Promise<void> {
  const parsed = Number.parseInt(jumpPaperPageInput.value, 10)
  if (!Number.isFinite(parsed)) return
  await projectStore.setProjectPaperPage(projectId.value, parsed)
  jumpPaperPageInput.value = ''
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Project Detail</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ project?.name ?? projectId }}
        </p>
      </div>
      <RouterLink to="/projects"
        class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
        <ArrowLeft class="h-4 w-4" />
        <span>Back</span>
      </RouterLink>
    </div>

    <div
      class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
      <div>
        <span class="text-xs text-slate-500">Project ID</span>
        <div>
          <CopyableText :text="projectId" mono />
        </div>
      </div>
      <div><span class="text-xs text-slate-500">Description</span>
        <div class="text-sm">{{ project?.description ?? '-' }}</div>
      </div>
      <div><span class="text-xs text-slate-500">Created</span>
        <div class="text-sm">{{ project ? formatDateTime(project.created_at) : '-' }}</div>
      </div>
      <div><span class="text-xs text-slate-500">Updated</span>
        <div class="text-sm">{{ project ? formatDateTime(project.updated_at) : '-' }}</div>
      </div>
    </div>

    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Papers ({{ paperPage.total }})
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          E = Extraction · EFC = Extraction Result Validation · AFC = Analysis Result Validation
        </p>
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div
          class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                <th class="px-3 py-2">#</th>
                <th class="px-3 py-2">Paper ID</th>
                <th class="px-4 py-2">Title</th>
                <th class="px-2 py-2">Status</th>
                <th class="px-2 py-2">
                  <AppButton size="xs" @click="togglePaperSort('created')">
                    <span>Created</span>
                    <ArrowUpWideNarrow v-if="paperSortField === 'created' && paperSortOrder === 'asc'"
                      class="h-3.5 w-3.5" />
                    <ArrowDownWideNarrow v-else-if="paperSortField === 'created' && paperSortOrder === 'desc'"
                      class="h-3.5 w-3.5" />
                    <ArrowDownUp v-else class="h-3.5 w-3.5" />
                  </AppButton>
                </th>
                <th class="px-2 py-2">
                  <AppButton size="xs" @click="togglePaperSort('updated')">
                    <span>Updated</span>
                    <ArrowUpWideNarrow v-if="paperSortField === 'updated' && paperSortOrder === 'asc'"
                      class="h-3.5 w-3.5" />
                    <ArrowDownWideNarrow v-else-if="paperSortField === 'updated' && paperSortOrder === 'desc'"
                      class="h-3.5 w-3.5" />
                    <ArrowDownUp v-else class="h-3.5 w-3.5" />
                  </AppButton>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="(paper, index) in sortedPapers" :key="paper.paper_id"
                class="cursor-pointer align-top transition-colors hover:bg-sky-50/60 dark:hover:bg-slate-800/70"
                :class="paper.paper_id === selectedPaperId ? 'bg-sky-50 dark:bg-sky-900/20' : ''"
                @click="selectPaper(paper)">
                <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  {{ paperPage.offset + index + 1 }}
                </td>
                <td class="px-3 py-2">
                  <CopyableText :text="paper.paper_id" mono />
                </td>
                <td class="px-3 py-2">
                  <div class="max-w-70 warp-break-word text-sm text-slate-700 dark:text-slate-200">
                    {{ paper.title ?? '-' }}
                  </div>
                </td>
                <td class="px-3 py-2 text-xs">
                  <div class="mb-1">
                    <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">E:</span>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="statusClass(paper.extraction_status)">
                      {{ paper.extraction_status }}
                    </span>
                  </div>
                  <div class="mb-1">
                    <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">EFC:</span>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="statusClass(paper.extraction_fact_check_status)">
                      {{ paper.extraction_fact_check_status }}
                    </span>
                  </div>
                  <div>
                    <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">AFC:</span>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="statusClass(paper.analysis_fact_check_status)">
                      {{ paper.analysis_fact_check_status }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2 text-xs">{{ formatDateTime(paper.created_at) }}</td>
                <td class="px-3 py-2 text-xs">{{ formatDateTime(paper.updated_at) }}</td>
              </tr>
              <tr v-if="sortedPapers.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No papers in this project
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside
          class="self-start rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
          <template v-if="selectedPaper">
            <header class="mb-4 space-y-2 flex flex-col">
              <div class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Eye class="h-3.5 w-3.5" />
                <span>Selected Paper</span>
              </div>
              <div class="flex justify-between gap-2">
                <CopyableText :text="selectedPaper.paper_id" mono />
                <AppButton tone="rose" size="xs" :disabled="unlinkingPaperId === selectedPaper.paper_id"
                  @click="unlinkPaper(selectedPaper.paper_id)">
                  <Unlink2 class="h-3.5 w-3.5" />
                  <span>Unlink</span>
                </AppButton>
              </div>
              <div class="warp-break-word text-sm font-bold text-slate-700 dark:text-slate-200">
                {{ selectedPaper.title ?? '-' }}
              </div>
            </header>

            <div class="mb-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">created:</span> {{
                formatDateTime(selectedPaper.created_at) }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">updated:</span> {{
                formatDateTime(selectedPaper.updated_at) }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">authors:</span> {{
                selectedPaper.authors.join(', ') || '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">year:</span> {{ selectedPaper.year ??
                '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">publication:</span> {{
                selectedPaper.publication ?? '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">doi:</span> {{ selectedPaper.doi ??
                '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">custom_meta:</span> {{
                selectedPaper.custom_meta ?? '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">raw_pdf_path:</span> {{
                selectedPaper.raw_pdf_path ?? '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">sha256:</span> {{
                selectedPaper.raw_pdf_sha256 ?? '-' }}</div>
            </div>

            <JsonPanel title="Raw paper JSON" :value="selectedPaper" :pre-wrap="true" max-height="48vh" defaultOpen />
          </template>
          <div v-else class="text-sm text-slate-500 dark:text-slate-400">
            No paper selected.
          </div>
        </aside>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="text-slate-600 dark:text-slate-300">
          Page {{ paperCurrentPage }} / {{ paperTotalPages }} · Total {{ paperPage.total }}
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-500 dark:text-slate-400">Rows</label>
          <select
            class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
            :value="paperPage.limit"
            @change="projectStore.setProjectPaperLimit(projectId, Number(($event.target as HTMLSelectElement).value))">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <AppButton size="xs" :disabled="!hasPrevPaperPage" @click="projectStore.prevProjectPaperPage(projectId)">
            <ChevronLeft class="h-3.5 w-3.5" />
            <span>Prev</span>
          </AppButton>
          <AppButton size="xs" :disabled="!hasNextPaperPage" @click="projectStore.nextProjectPaperPage(projectId)">
            <span>Next</span>
            <ChevronRight class="h-3.5 w-3.5" />
          </AppButton>
          <div class="ml-1 inline-flex items-center gap-1.5">
            <input v-model="jumpPaperPageInput" type="number" min="1" :max="paperTotalPages" placeholder="Page"
              class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
              @keydown.enter.prevent="jumpToPaperPage" />
            <AppButton size="xs" @click="jumpToPaperPage">
              <span>Go</span>
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
