<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ListChecks,
  Sparkles,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  LibraryBig,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Tag,
  Trash2,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import LibrarySummaryCards from '@/components/library/LibrarySummaryCards.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import { useActivityPresentation } from '@/composables/useActivityPresentation'
import { useDialog } from '@/composables/useDialog'
import type {
  LibrarianGlobalFinderYearDistribution,
  LibrarianTagCount,
  ProjectActivity,
  ProjectOverviewResponse,
} from '@/types/api'
import { ACTIVITY_CATEGORY_ICONS } from '@/utils/activityAppearance'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  loading: boolean
  error: string | null
  stats: ProjectOverviewResponse['stats'] | null
  attentionItems: ProjectOverviewResponse['attention_items']
  recentPapers: ProjectOverviewResponse['recent_papers']
  recentFiles: ProjectOverviewResponse['recent_files']
  recentActivities: ProjectActivity[]
  topTags: LibrarianTagCount[]
  yearDistribution: LibrarianGlobalFinderYearDistribution | null
  yearRange: string | null
  sectionErrors: Record<string, string>
  agentSummary: string | null
  summaryUpdating: boolean
  summaryError: string | null
}>()

const emit = defineEmits<{
  retry: []
  'update:agentSummary': [content: string]
  'delete:agentSummary': []
  forceAgentSummary: []
  openPaper: [paperId: string]
  openFile: [filePath: string]
  openActivity: [activityId?: string]
}>()

const { t } = useI18n()
const { eventLabel, stageLabel } = useActivityPresentation()
const dialog = useDialog()

const isEditingSummary = ref(false)
const summaryDraft = ref('')

const summaryDirty = computed(
  () => isEditingSummary.value && summaryDraft.value !== (props.agentSummary ?? ''),
)
const hasAnyData = computed(
  () =>
    Boolean(props.stats) ||
    props.attentionItems.length > 0 ||
    props.recentPapers.length > 0 ||
    props.recentFiles.length > 0 ||
    props.recentActivities.length > 0,
)

const statCards = computed(() => {
  const stats = props.stats
  if (!stats) return []
  return [
    {
      key: 'papers',
      label: t('workbench.overview.stats.papers'),
      value: stats.paper_count,
      color: 'text-ppx-info',
      icon: LibraryBig,
    },
    {
      key: 'parsed',
      label: t('workbench.overview.stats.parsed'),
      value: stats.parsed_count,
      color: 'text-ppx-success',
      icon: CheckCircle2,
    },
    {
      key: 'activeTasks',
      label: t('workbench.overview.stats.activeTasks'),
      value: stats.active_task_count,
      color: 'text-ppx-accent',
      icon: LoaderCircle,
    },
    {
      key: 'attention',
      label: t('workbench.overview.stats.attention'),
      value: stats.attention_count,
      color: 'text-ppx-warning',
      icon: AlertTriangle,
    },
  ]
})

function sectionError(key: string): string | null {
  return props.sectionErrors[key] ?? null
}

function fmtNum(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return String(Math.round(value * 10) / 10)
}

const yearMetrics = computed(() => {
  const years = props.yearDistribution
  if (!years) return []
  return [
    { key: 'mean', label: t('projects.librarian.globalFinder.mean'), value: fmtNum(years.mean) },
    {
      key: 'median',
      label: t('projects.librarian.globalFinder.median'),
      value: fmtNum(years.median),
    },
    {
      key: 'available',
      label: t('projects.librarian.globalFinder.availableYears'),
      value: years.available_count,
    },
    {
      key: 'missing',
      label: t('projects.librarian.globalFinder.missingYears'),
      value: years.missing_count,
    },
  ]
})

function fmtSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function beginEditSummary(): void {
  summaryDraft.value = props.agentSummary ?? ''
  isEditingSummary.value = true
}

function saveSummary(): void {
  emit('update:agentSummary', summaryDraft.value)
}
watch(
  () => [props.summaryUpdating, props.agentSummary],
  () => {
    if (
      isEditingSummary.value &&
      !props.summaryUpdating &&
      summaryDraft.value === (props.agentSummary ?? '')
    )
      isEditingSummary.value = false
  },
)

async function confirmDiscard(): Promise<boolean> {
  return dialog.confirm({
    title: t('projects.fileBrowser.unsavedTitle'),
    message: t('projects.fileBrowser.unsavedMessage'),
    confirmText: t('projects.fileBrowser.discard'),
    tone: 'danger',
  })
}

async function cancelEditSummary(): Promise<void> {
  if (summaryDirty.value && !(await confirmDiscard())) return
  isEditingSummary.value = false
}

async function ensureCanLeave(): Promise<boolean> {
  if (!summaryDirty.value) return true
  const ok = await confirmDiscard()
  if (ok) isEditingSummary.value = false
  return ok
}

defineExpose({ ensureCanLeave })
</script>

<template>
  <section class="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
    <div class="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
      <div
        v-if="loading && !hasAnyData"
        class="flex flex-col items-center justify-center gap-3 py-12"
      >
        <LoaderCircle class="text-ppx-accent h-8 w-8 animate-spin" />
        <p class="text-ppx-text-soft text-sm">{{ t('common.loading') }}</p>
      </div>

      <div
        v-else-if="error && !hasAnyData"
        class="workspace-panel mx-auto flex max-w-sm flex-col items-center gap-3 p-6 text-center"
      >
        <AlertCircle class="text-ppx-danger h-8 w-8" />
        <p class="text-ppx-text-soft text-sm">{{ error }}</p>
        <AppButton size="sm" variant="outline" tone="rose" @click="emit('retry')">
          <RefreshCw class="h-4 w-4" />
          <span>{{ t('actions.retry') }}</span>
        </AppButton>
      </div>

      <div v-else class="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <p v-if="error" role="alert" class="text-ppx-danger text-sm xl:col-span-2">{{ error }}</p>
        <div
          v-if="sectionError('stats')"
          class="workspace-panel-inset text-ppx-text-soft flex items-center justify-between gap-2 rounded-xl p-3 text-xs xl:col-span-2"
        >
          <span class="inline-flex items-center gap-1.5">
            <AlertTriangle class="text-ppx-warning h-3.5 w-3.5" />
            {{ t('workbench.overview.sectionFailed') }}
          </span>
          <AppButton size="xs" variant="outline" @click="emit('retry')">
            {{ t('actions.retry') }}
          </AppButton>
        </div>
        <LibrarySummaryCards
          v-else-if="statCards.length"
          :cards="statCards"
          class="overview-stats xl:col-span-2"
        />

        <!-- Attention -->
        <div class="overview-card space-y-4 xl:col-span-2">
          <h4 class="overview-card-heading">
            <AlertTriangle class="text-ppx-warning h-4 w-4" />{{
              t('workbench.overview.attention.title')
            }}
          </h4>
          <div
            v-if="sectionError('attention')"
            class="text-ppx-text-soft flex items-center justify-between gap-2 text-xs"
          >
            <span>{{ t('workbench.overview.sectionFailed') }}</span>
            <AppButton size="xs" variant="outline" @click="emit('retry')">
              {{ t('actions.retry') }}
            </AppButton>
          </div>
          <p
            v-else-if="attentionItems.length === 0"
            class="text-ppx-text-soft flex items-center gap-2 text-sm"
          >
            <CheckCircle2 class="text-ppx-success h-4 w-4" />{{
              t('workbench.overview.attention.empty')
            }}
          </p>
          <ul v-else class="space-y-1.5">
            <li
              v-for="item in attentionItems"
              :key="`${item.paper_id}-${item.stage}`"
              class="workspace-subpanel flex flex-wrap items-center justify-between gap-2 rounded-xl p-2.5"
            >
              <div class="min-w-0 space-y-0.5">
                <div class="text-ppx-text truncate text-sm font-medium">
                  {{ item.title ?? item.paper_id }}
                </div>
                <div class="text-ppx-text-soft flex flex-wrap items-center gap-1.5 text-xs">
                  <span class="workspace-badge workspace-badge--warning px-2 py-0.5 text-xs">
                    {{ stageLabel(item.stage) }}
                  </span>
                  <span v-if="item.error" class="text-ppx-danger break-all">{{ item.error }}</span>
                </div>
              </div>
              <AppButton size="xs" variant="outline" @click="emit('openPaper', item.paper_id)">
                <FileText class="h-3 w-3" />
                <span>{{ t('workbench.overview.attention.openPaper') }}</span>
              </AppButton>
            </li>
          </ul>
        </div>

        <!-- AI summary -->
        <div class="overview-card space-y-4 xl:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <h4 class="overview-card-heading">
                <Sparkles class="text-ppx-accent h-4 w-4" />{{ t('projects.summaryTitle') }}
              </h4>
              <div v-if="summaryUpdating" class="flex items-center gap-1.5">
                <LoaderCircle class="text-ppx-accent h-4 w-4 animate-spin" />
                <span class="text-ppx-text-soft text-xs">{{
                  t('projects.agentSummaryLoading')
                }}</span>
              </div>
            </div>
            <div v-if="!isEditingSummary" class="flex items-center gap-1">
              <AppButton
                size="xs"
                variant="outline"
                :disabled="summaryUpdating"
                @click="emit('forceAgentSummary')"
              >
                <RefreshCw class="h-3 w-3" />
                {{
                  t(agentSummary ? 'workbench.summary.regenerate' : 'workbench.summary.generate')
                }}
              </AppButton>
              <AppButton
                size="xs"
                variant="outline"
                :aria-label="t('actions.edit')"
                :disabled="summaryUpdating"
                @click="beginEditSummary"
              >
                <Pencil class="h-3 w-3" />
              </AppButton>
              <AppButton
                v-if="agentSummary"
                size="xs"
                variant="outline"
                tone="rose"
                icon-only
                :title="t('actions.delete')"
                :aria-label="t('actions.delete')"
                :disabled="summaryUpdating"
                @click="emit('delete:agentSummary')"
              >
                <Trash2 class="h-3 w-3" />
              </AppButton>
            </div>
          </div>
          <p v-if="summaryError" role="alert" class="text-ppx-danger text-sm">{{ summaryError }}</p>

          <div v-if="isEditingSummary" class="space-y-2">
            <textarea
              v-model="summaryDraft"
              rows="6"
              class="workspace-textarea text-sm"
              :disabled="summaryUpdating"
            />
            <div class="flex items-center justify-end gap-2">
              <AppButton size="xs" variant="outline" @click="cancelEditSummary">
                {{ t('projects.actions.cancel') }}
              </AppButton>
              <AppButton
                size="xs"
                variant="solid"
                tone="sky"
                :disabled="summaryUpdating"
                @click="saveSummary"
              >
                {{ t('projects.actions.save') }}
              </AppButton>
            </div>
          </div>
          <div v-else-if="agentSummary" class="overview-summary text-ppx-text-soft text-sm">
            <MarkdownContent :markdown="agentSummary" :enable-math="false" />
          </div>
          <div v-else class="text-ppx-text-soft text-sm">
            {{ t('workbench.summary.empty') }}
          </div>
        </div>

        <!-- Recent papers -->
        <div class="overview-card space-y-3">
          <h4 class="overview-card-heading">
            <LibraryBig class="text-ppx-text-soft h-4 w-4" />{{
              t('workbench.overview.recentPapers.title')
            }}
          </h4>
          <div
            v-if="sectionError('recent_papers')"
            class="text-ppx-text-soft flex items-center justify-between gap-2 text-xs"
          >
            <span class="inline-flex items-center gap-1.5">
              <AlertTriangle class="text-ppx-warning h-3.5 w-3.5" />
              {{ t('workbench.overview.sectionFailed') }}
            </span>
            <AppButton size="xs" variant="outline" @click="emit('retry')">
              {{ t('actions.retry') }}
            </AppButton>
          </div>
          <p v-else-if="recentPapers.length === 0" class="text-ppx-text-soft text-xs">
            {{ t('workbench.overview.recentPapers.empty') }}
          </p>
          <ul v-else class="space-y-1">
            <li v-for="paper in recentPapers" :key="paper.paper_id">
              <button
                type="button"
                class="overview-link"
                :title="paper.title ?? paper.paper_id"
                @click="emit('openPaper', paper.paper_id)"
              >
                <span class="overview-link-icon"><LibraryBig class="h-4 w-4" /></span>
                <span class="overview-link-title">{{ paper.title ?? paper.paper_id }}</span>
                <time class="overview-link-meta" :datetime="paper.updated_at">{{
                  formatDateTime(paper.updated_at)
                }}</time>
                <ChevronRight class="overview-link-arrow h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Recent files -->
        <div class="overview-card space-y-3">
          <h4 class="overview-card-heading">
            <FileText class="text-ppx-text-soft h-4 w-4" />{{
              t('workbench.overview.recentFiles.title')
            }}
          </h4>
          <div
            v-if="sectionError('recent_files')"
            class="text-ppx-text-soft flex items-center justify-between gap-2 text-xs"
          >
            <span class="inline-flex items-center gap-1.5">
              <AlertTriangle class="text-ppx-warning h-3.5 w-3.5" />
              {{ t('workbench.overview.sectionFailed') }}
            </span>
            <AppButton size="xs" variant="outline" @click="emit('retry')">
              {{ t('actions.retry') }}
            </AppButton>
          </div>
          <p v-else-if="recentFiles.length === 0" class="text-ppx-text-soft text-xs">
            {{ t('workbench.overview.recentFiles.empty') }}
          </p>
          <ul v-else class="space-y-1">
            <li v-for="file in recentFiles" :key="file.file_path">
              <button
                type="button"
                class="overview-link"
                :title="file.file_path"
                @click="emit('openFile', file.file_path)"
              >
                <span class="overview-link-icon"
                  ><ImageIcon v-if="file.kind === 'image'" class="h-4 w-4" /><FileText
                    v-else
                    class="h-4 w-4"
                /></span>
                <span class="overview-link-title">{{ file.name }}</span>
                <span class="overview-link-meta">{{ fmtSize(file.size) }}</span>
                <ChevronRight class="overview-link-arrow h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Recent activities -->
        <div class="overview-card space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h4 class="overview-card-heading">
              <ListChecks class="text-ppx-text-soft h-4 w-4" />{{
                t('workbench.overview.recentActivities.title')
              }}
            </h4>
            <AppButton size="xs" variant="transparent" @click="emit('openActivity')">
              {{ t('workbench.overview.recentActivities.viewAll') }}
            </AppButton>
          </div>
          <div
            v-if="sectionError('recent_activities')"
            class="text-ppx-text-soft flex items-center justify-between gap-2 text-xs"
          >
            <span class="inline-flex items-center gap-1.5">
              <AlertTriangle class="text-ppx-warning h-3.5 w-3.5" />
              {{ t('workbench.overview.sectionFailed') }}
            </span>
            <AppButton size="xs" variant="outline" @click="emit('retry')">
              {{ t('actions.retry') }}
            </AppButton>
          </div>
          <p v-else-if="recentActivities.length === 0" class="text-ppx-text-soft text-xs">
            {{ t('workbench.overview.recentActivities.empty') }}
          </p>
          <ul v-else class="space-y-1">
            <li v-for="activity in recentActivities" :key="activity.activity_id">
              <button
                type="button"
                class="overview-link"
                :title="eventLabel(activity)"
                @click="emit('openActivity', activity.activity_id)"
              >
                <span class="overview-link-icon"
                  ><component :is="ACTIVITY_CATEGORY_ICONS[activity.category]" class="h-4 w-4"
                /></span>
                <span class="overview-link-title">{{ eventLabel(activity) }}</span>
                <time class="overview-link-meta" :datetime="activity.created_at">{{
                  formatDateTime(activity.created_at)
                }}</time>
                <ChevronRight class="overview-link-arrow h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Auxiliary statistics keep their natural height. -->
        <div class="overview-card space-y-4">
          <h4 class="overview-card-heading">
            <Tag class="text-ppx-accent h-4 w-4" />{{ t('workbench.overview.tags.title') }}
          </h4>
          <div
            v-if="sectionError('top_tags')"
            class="text-ppx-text-soft flex items-center justify-between gap-2 text-sm"
          >
            <span>{{ t('workbench.overview.sectionFailed') }}</span
            ><AppButton size="xs" variant="outline" @click="emit('retry')">{{
              t('actions.retry')
            }}</AppButton>
          </div>
          <p v-else-if="!topTags.length" class="text-ppx-text-muted text-sm">
            {{ t('workbench.overview.tags.empty') }}
          </p>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="tag in topTags"
              :key="tag.tag"
              class="border-ppx-border bg-ppx-bg-subtle text-ppx-text inline-flex max-w-full items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3 text-xs"
            >
              <span class="min-w-0 truncate">{{ tag.tag }}</span
              ><span
                class="bg-ppx-accent-soft text-ppx-accent rounded-full px-2 py-0.5 font-semibold tabular-nums"
                >{{ tag.count }}</span
              >
            </span>
          </div>
          <div class="border-ppx-border space-y-3 border-t pt-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h4 class="overview-card-heading">
                <Calendar class="text-ppx-accent h-4 w-4" />{{
                  t('workbench.overview.years.title')
                }}
              </h4>
              <span v-if="yearRange" class="text-ppx-text-muted text-xs tabular-nums">{{
                yearRange
              }}</span>
            </div>
            <div
              v-if="sectionError('year_distribution')"
              class="text-ppx-text-soft flex items-center justify-between gap-2 text-sm"
            >
              <span>{{ t('workbench.overview.sectionFailed') }}</span
              ><AppButton size="xs" variant="outline" @click="emit('retry')">{{
                t('actions.retry')
              }}</AppButton>
            </div>
            <dl v-else-if="yearDistribution" class="grid grid-cols-2 gap-3">
              <div
                v-for="metric in yearMetrics"
                :key="metric.key"
                class="rounded-ppx-interactive border-ppx-border bg-ppx-bg-subtle border px-3 py-2.5"
              >
                <dt class="text-ppx-text-muted text-xs">{{ metric.label }}</dt>
                <dd class="text-ppx-text mt-1 text-xl font-semibold tracking-tight tabular-nums">
                  {{ metric.value }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.overview-card {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--ppx-border);
  border-radius: var(--ppx-radius-panel);
  background: var(--ppx-bg-elevated);
}
.overview-card-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ppx-text);
  font-size: 0.875rem;
  font-weight: 600;
}
.overview-stats :deep(.workspace-stat-card) {
  padding: 1rem;
}
.overview-stats :deep(.workspace-meta) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  color: var(--ppx-text-soft);
}
.overview-summary {
  line-height: 1.85;
}
.overview-link {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto 1rem;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.5rem;
  border-radius: var(--ppx-radius-interactive);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--ppx-motion-fast) var(--ppx-ease);
}
.overview-link:hover,
.overview-link:focus-visible {
  background: var(--ppx-accent-soft);
}
.overview-link:focus-visible {
  outline: 2px solid var(--ppx-accent);
  outline-offset: -2px;
}
.overview-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--ppx-radius-interactive);
  color: var(--ppx-text-soft);
  background: var(--ppx-bg-subtle);
}
.overview-link-title {
  min-width: 0;
  color: var(--ppx-text);
  font-size: 0.875rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
}
.overview-link-meta {
  color: var(--ppx-text-muted);
  font-size: 0.6875rem;
  white-space: nowrap;
}
.overview-link-arrow {
  color: var(--ppx-text-muted);
  transition:
    color var(--ppx-motion-fast) var(--ppx-ease),
    transform var(--ppx-motion-fast) var(--ppx-ease);
}
.overview-link:hover .overview-link-arrow,
.overview-link:focus-visible .overview-link-arrow {
  color: var(--ppx-accent);
  transform: translateX(2px);
}
@media (max-width: 640px) {
  .overview-link {
    grid-template-columns: 2rem minmax(0, 1fr) 1rem;
    gap: 0.375rem 0.625rem;
  }
  .overview-link-icon {
    grid-row: 1 / 3;
  }
  .overview-link-meta {
    grid-column: 2;
    grid-row: 2;
  }
  .overview-link-arrow {
    grid-column: 3;
    grid-row: 1 / 3;
  }
}
</style>
