<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpWideNarrow,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Eye,
  ExternalLink,
  FileJson,
  History,
  Search,
  Unlink2,
} from 'lucide-vue-next'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { api } from '../api/client'
import AppButton from '../components/AppButton.vue'
import CopyableText from '../components/CopyableText.vue'
import JsonPanel from '../components/JsonPanel.vue'
import { useNotify } from '../composables/notify'
import { useTriSort } from '../composables/triSort'
import { useProjectStore } from '../stores/projects'
import type { PaperResponse, ProjectExportField } from '../types/api'
import { formatDateTime } from '../utils/format'

const route = useRoute()
const projectStore = useProjectStore()
const notify = useNotify()
const { t } = useI18n()
const projectId = computed(() => String(route.params.projectId ?? ''))
const unlinkingPaperId = ref<string | null>(null)
const exporting = ref(false)
const selectedPaperId = ref<string | null>(null)
const jumpPaperPageInput = ref('')
const keyword = ref('')
const exportCitationsMode = ref<'keep' | 'strip'>('keep')
const { sortField: paperSortField, sortOrder: paperSortOrder, toggleSort: togglePaperSort } =
  useTriSort<'created' | 'updated'>()
const EXPORT_FIELDS: ProjectExportField[] = [
  'paper_id',
  'project_ids',
  'title',
  'authors',
  'year',
  'publication',
  'doi',
  'custom_meta',
  'raw_pdf_path',
  'raw_pdf_sha256',
  'images_paths',
  'extraction_status',
  'extraction_fact_check_status',
  'analysis_fact_check_status',
  'extraction_retry_count',
  'analysis_retry_count',
  'created_at',
  'updated_at',
  'quick_scan',
  'synthesis_data',
  'analysis_report',
  'extraction_fact_check_result',
  'analysis_fact_check_result',
]
const selectedExportFields = ref<ProjectExportField[]>([...EXPORT_FIELDS])

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

const filteredPapers = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return papers.value
  }
  return papers.value.filter((paper) => {
    const haystacks = [
      paper.paper_id,
      paper.title ?? '',
      paper.authors.join(' '),
      paper.publication ?? '',
      paper.doi ?? '',
    ]
    return haystacks.some((item) => item.toLowerCase().includes(search))
  })
})

const selectedPaper = computed<PaperResponse | null>(() => {
  if (!selectedPaperId.value) {
    return null
  }
  return sortedPapers.value.find((paper) => paper.paper_id === selectedPaperId.value) ?? null
})

const selectedPaperCustomMeta = computed<Record<string, unknown> | null>(() => {
  const raw = selectedPaper.value?.custom_meta
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
})

const selectedPaperZoteroKey = computed<string | null>(() => {
  const value = selectedPaperCustomMeta.value?.zotero_key
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }
  return value.trim()
})

const selectedPaperZoteroUrl = computed<string | null>(() => {
  if (!selectedPaperZoteroKey.value) return null
  return `zotero://select/library/items/${selectedPaperZoteroKey.value}`
})

const sortedPapers = computed(() => {
  const items = [...filteredPapers.value]
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
  sortedPapers,
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

async function openZoteroWithFallback(): Promise<void> {
  const url = selectedPaperZoteroUrl.value
  const key = selectedPaperZoteroKey.value
  if (!url || !key) return

  let cleared = false
  const timer = window.setTimeout(async () => {
    if (cleared) return
    try {
      await navigator.clipboard.writeText(key)
      notify.push(t('projectDetail.zoteroCopied', { key }), 'warning', 4200)
    } catch {
      notify.push(t('projectDetail.zoteroKeyOnly', { key }), 'warning', 4200)
    }
  }, 1200)

  const clearFallback = (): void => {
    cleared = true
    window.clearTimeout(timer)
    window.removeEventListener('blur', clearFallback)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') clearFallback()
  }
  window.addEventListener('blur', clearFallback, { once: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.location.href = url
}

function selectAllExportFields(): void {
  selectedExportFields.value = [...EXPORT_FIELDS]
}

function clearExportFields(): void {
  selectedExportFields.value = []
}

function toggleExportField(field: ProjectExportField): void {
  const exists = selectedExportFields.value.includes(field)
  if (exists) {
    selectedExportFields.value = selectedExportFields.value.filter((item) => item !== field)
    return
  }
  selectedExportFields.value = [...selectedExportFields.value, field]
}

async function exportProjectBundle(): Promise<void> {
  if (selectedExportFields.value.length === 0) {
    notify.push(t('projectDetail.chooseExportField'), 'warning')
    return
  }
  exporting.value = true
  try {
    const blob = await api.exportProject(projectId.value, {
      fields: selectedExportFields.value,
      citations_mode: exportCitationsMode.value,
    })
    const filename = `project_${projectId.value}_export.zip`
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    notify.push(t('projectDetail.exportReady'), 'success')
  } catch (error) {
    notify.push(error instanceof Error ? error.message : t('errors.exportProject'), 'error', 3600)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ t('projectDetail.title') }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ project?.name ?? projectId }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton size="sm" tone="sky" :disabled="exporting" @click="exportProjectBundle">
          <Download class="h-4 w-4" />
          <span>{{ exporting ? t('actions.exporting') : t('actions.export') }}</span>
        </AppButton>
        <RouterLink to="/projects"
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          <ArrowLeft class="h-4 w-4" />
          <span>{{ t('actions.back') }}</span>
        </RouterLink>
      </div>
    </div>

    <div
      class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
      <div>
        <span class="text-xs text-slate-500">{{ t('projectDetail.projectId') }}</span>
        <div>
          <CopyableText :text="projectId" mono />
        </div>
      </div>
      <div><span class="text-xs text-slate-500">{{ t('projectDetail.description') }}</span>
        <div class="text-sm">{{ project?.description ?? '-' }}</div>
      </div>
      <div><span class="text-xs text-slate-500">{{ t('projectDetail.created') }}</span>
        <div class="text-sm">{{ project ? formatDateTime(project.created_at) : '-' }}</div>
      </div>
      <div><span class="text-xs text-slate-500">{{ t('projectDetail.updated') }}</span>
        <div class="text-sm">{{ project ? formatDateTime(project.updated_at) : '-' }}</div>
      </div>
    </div>

    <details
      class="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <span class="inline-flex items-center gap-2">
          <History class="h-4 w-4" />
          <span>{{ t('projectDetail.operationLogs', { count: project?.operation_logs?.length ?? 0 }) }}</span>
        </span>
        <ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div class="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
        <div v-if="!project || !project.operation_logs || project.operation_logs.length === 0"
          class="text-sm text-slate-500 dark:text-slate-400">
          {{ t('projectDetail.noOperationLogs') }}
        </div>
        <div v-else class="space-y-3">
          <JsonPanel v-for="(log, index) in project.operation_logs" :key="index" :title="t('projectDetail.logTitle', { index: index + 1 })"
            :value="log" pre-wrap :default-open="index === 0" max-height="18rem" />
        </div>
      </div>
    </details>

    <details
      class="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <span class="inline-flex items-center gap-2">
          <FileJson class="h-4 w-4" />
          <span>{{ t('projectDetail.exportOptions', { count: selectedExportFields.length }) }}</span>
        </span>
        <ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-4 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
        <div class="flex flex-wrap items-center gap-2">
          <AppButton size="xs" @click="selectAllExportFields">
            <span>{{ t('actions.selectAll') }}</span>
          </AppButton>
          <AppButton size="xs" variant="outline" @click="clearExportFields">
            <span>{{ t('actions.clear') }}</span>
          </AppButton>
          <div class="ml-2 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{{ t('projectDetail.citations') }}:</span>
            <label class="inline-flex items-center gap-1">
              <input v-model="exportCitationsMode" type="radio" value="keep" />
              <span>{{ t('projectDetail.keepCitations') }}</span>
            </label>
            <label class="inline-flex items-center gap-1">
              <input v-model="exportCitationsMode" type="radio" value="strip" />
              <span>{{ t('projectDetail.stripCitations') }}</span>
            </label>
          </div>
        </div>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label v-for="field in EXPORT_FIELDS" :key="field"
            class="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700">
            <input type="checkbox" :checked="selectedExportFields.includes(field)" @change="toggleExportField(field)" />
            <span class="font-mono">{{ t(`projectDetail.exportFields.${field}`) }}</span>
          </label>
        </div>
      </div>
    </details>

    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {{ t('projectDetail.papers', { count: paperPage.total }) }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ t('tasks.legend') }}
        </p>
      </div>

      <div
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search class="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <input v-model="keyword" :placeholder="t('projectDetail.paperSearchPlaceholder')"
          class="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div
          class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                <th class="px-3 py-2">#</th>
                <th class="px-3 py-2">{{ t('projectDetail.table.paperId') }}</th>
                <th class="px-4 py-2">{{ t('projectDetail.table.title') }}</th>
                <th class="px-2 py-2">{{ t('projectDetail.table.status') }}</th>
                <th class="px-2 py-2">
                  <AppButton size="xs" @click="togglePaperSort('created')">
                    <span>{{ t('projectDetail.table.created') }}</span>
                    <ArrowUpWideNarrow v-if="paperSortField === 'created' && paperSortOrder === 'asc'"
                      class="h-3.5 w-3.5" />
                    <ArrowDownWideNarrow v-else-if="paperSortField === 'created' && paperSortOrder === 'desc'"
                      class="h-3.5 w-3.5" />
                    <ArrowDownUp v-else class="h-3.5 w-3.5" />
                  </AppButton>
                </th>
                <th class="px-2 py-2">
                  <AppButton size="xs" @click="togglePaperSort('updated')">
                    <span>{{ t('projectDetail.table.updated') }}</span>
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
                    <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.rawPaperStatus.extraction') }}:</span>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="statusClass(paper.extraction_status)">
                      {{ paper.extraction_status }}
                    </span>
                  </div>
                  <div class="mb-1">
                    <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.rawPaperStatus.extractionFactCheck') }}:</span>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="statusClass(paper.extraction_fact_check_status)">
                      {{ paper.extraction_fact_check_status }}
                    </span>
                  </div>
                  <div>
                    <span class="mr-1 font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.rawPaperStatus.analysisFactCheck') }}:</span>
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
                  {{ t('projectDetail.noPapers') }}
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
                <span>{{ t('projectDetail.selectedPaper') }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <CopyableText :text="selectedPaper.paper_id" mono />
                <div class="flex items-center gap-2">
                  <button v-if="selectedPaperZoteroUrl" type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-slate-800"
                    :title="t('projectDetail.zoteroOpenTitle', { key: selectedPaperZoteroKey })" @click="openZoteroWithFallback">
                    <ExternalLink class="h-3.5 w-3.5" />
                    <span>Zotero</span>
                  </button>
                  <AppButton tone="rose" size="xs" :disabled="unlinkingPaperId === selectedPaper.paper_id"
                    @click="unlinkPaper(selectedPaper.paper_id)">
                    <Unlink2 class="h-3.5 w-3.5" />
                    <span>{{ t('actions.unlink') }}</span>
                  </AppButton>
                </div>
              </div>
              <div class="warp-break-word text-sm font-bold text-slate-700 dark:text-slate-200">
                {{ selectedPaper.title ?? '-' }}
              </div>
            </header>

            <div class="mb-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.created') }}:</span> {{
                formatDateTime(selectedPaper.created_at) }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.updated') }}:</span> {{
                formatDateTime(selectedPaper.updated_at) }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.authors') }}:</span> {{
                selectedPaper.authors.join(', ') || '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.year') }}:</span> {{ selectedPaper.year ??
                '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.publication') }}:</span> {{
                selectedPaper.publication ?? '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.doi') }}:</span> {{ selectedPaper.doi ??
                '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.customMeta') }}:</span> {{
                selectedPaper.custom_meta ?? '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.rawPdfPath') }}:</span> {{
                selectedPaper.raw_pdf_path ?? '-' }}</div>
              <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.sha256') }}:</span> {{
                selectedPaper.raw_pdf_sha256 ?? '-' }}</div>
            </div>

            <JsonPanel :title="t('projectDetail.rawPaperJson')" :value="selectedPaper" :pre-wrap="true" max-height="48vh" defaultOpen />
          </template>
          <div v-else class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('projectDetail.noPaperSelected') }}
          </div>
        </aside>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="text-slate-600 dark:text-slate-300">
          {{ t('common.pageSummary', { current: paperCurrentPage, total: paperTotalPages, count: paperPage.total }) }}
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-500 dark:text-slate-400">{{ t('common.rows') }}</label>
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
            <span>{{ t('actions.prev') }}</span>
          </AppButton>
          <AppButton size="xs" :disabled="!hasNextPaperPage" @click="projectStore.nextProjectPaperPage(projectId)">
            <span>{{ t('actions.next') }}</span>
            <ChevronRight class="h-3.5 w-3.5" />
          </AppButton>
          <div class="ml-1 inline-flex items-center gap-1.5">
            <input v-model="jumpPaperPageInput" type="number" min="1" :max="paperTotalPages" :placeholder="t('common.page')"
              class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
              @keydown.enter.prevent="jumpToPaperPage" />
            <AppButton size="xs" @click="jumpToPaperPage">
              <span>{{ t('actions.go') }}</span>
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
