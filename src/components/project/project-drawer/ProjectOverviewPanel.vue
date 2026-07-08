<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertTriangle,
  Calendar,
  LibraryBig,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Tag,
  Trash2,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import CopyableText from '@/components/CopyableText.vue'
import LibrarySummaryCards from '@/components/library/LibrarySummaryCards.vue'
import type { ProjectResponse, LibrarianGlobalFinderResponse } from '@/types/api'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  project: ProjectResponse | null
  globalFinder: LibrarianGlobalFinderResponse | null
  loading: boolean
}>()

const emit = defineEmits<{
  'update:agentSummary': [content: string]
  'delete:agentSummary': []
  forceAgentSummary: []
}>()

const { t } = useI18n()

const isEditingAgentSummary = ref(false)
const agentSummaryDraft = ref('')
const isUpdatingAgentSummary = ref(false)

watch(
  () => props.project?.agent_summary,
  () => {
    isUpdatingAgentSummary.value = false
  },
)

const summaryCards = computed(() => {
  const stats = props.globalFinder?.stats
  const cards = []
  if (stats) {
    cards.push(
      {
        key: 'paperCount',
        label: t('projects.statusCards.total'),
        value: stats.paper_count,
        color: 'text-ppx-info',
        icon: LibraryBig,
      },
      {
        key: 'availableYears',
        label: t('projects.librarian.globalFinder.availableYears'),
        value: stats.year_distribution.available_count,
        color: 'text-ppx-success',
        icon: Calendar,
      },
      {
        key: 'missingYears',
        label: t('projects.librarian.globalFinder.missingYears'),
        value: stats.year_distribution.missing_count,
        color: 'text-ppx-warning',
        icon: AlertTriangle,
      },
      {
        key: 'topTags',
        label: t('projects.librarian.globalFinder.topTags'),
        value: stats.top_tags.length,
        color: 'text-ppx-accent',
        icon: Tag,
      },
    )
  }
  return cards
})

const yearDistribution = computed(() => props.globalFinder?.stats?.year_distribution)
const topTags = computed(() => props.globalFinder?.stats?.top_tags ?? [])
const agentSummary = computed(() => props.project?.agent_summary)

function fmtNum(value: number | null): string {
  if (value === null || value === undefined) return '-'
  const v = Number(value)
  return Math.round(v * 10) / 10 + ''
}
</script>

<template>
  <div>
    <div v-if="loading" class="flex flex-col items-center justify-center gap-3 py-12">
      <LoaderCircle class="text-ppx-text-soft h-8 w-8 animate-spin" />
      <p class="text-ppx-text-soft text-sm">{{ t('projects.common.loading') }}</p>
      <p class="text-ppx-text-soft text-xs">{{ t('projects.agentSummaryLoading') }}</p>
    </div>

    <div v-else-if="project" class="space-y-4">
      <div class="space-y-1.5">
        <h4 class="text-ppx-text text-base font-semibold tracking-tight">{{ project.name }}</h4>
        <p v-if="project.description" class="text-ppx-text text-sm leading-relaxed">
          {{ project.description }}
        </p>
        <div class="text-ppx-text-soft space-y-0.5 text-xs">
          <div>
            <span>{{ t('projects.projectId') }}:</span>
            <CopyableText :text="project.project_id" class="ml-1" />
          </div>
          <div>{{ t('projects.created') }}: {{ formatDateTime(project.created_at) }}</div>
          <div>{{ t('projects.updated') }}: {{ formatDateTime(project.updated_at) }}</div>
        </div>
      </div>

      <LibrarySummaryCards :cards="summaryCards" />

      <div v-if="yearDistribution" class="workspace-panel-inset space-y-2 rounded-xl p-3">
        <h4 class="workspace-label mb-0">{{ t('projects.librarian.globalFinder.yearStats') }}</h4>
        <div class="text-ppx-text-soft grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <span class="text-ppx-text font-medium"
              >{{ t('projects.librarian.globalFinder.mean') }}:</span
            >
            {{ fmtNum(yearDistribution.mean) }}
          </div>
          <div>
            <span class="text-ppx-text font-medium"
              >{{ t('projects.librarian.globalFinder.median') }}:</span
            >
            {{ fmtNum(yearDistribution.median) }}
          </div>
          <div>
            <span class="text-ppx-text font-medium"
              >{{ t('projects.librarian.globalFinder.q25') }}:</span
            >
            {{ fmtNum(yearDistribution.q25) }}
          </div>
          <div>
            <span class="text-ppx-text font-medium"
              >{{ t('projects.librarian.globalFinder.q75') }}:</span
            >
            {{ fmtNum(yearDistribution.q75) }}
          </div>
          <div>
            <span class="text-ppx-text font-medium"
              >{{ t('projects.librarian.globalFinder.outliers') }}:</span
            >
            {{ yearDistribution.outlier_count }}
            <span v-if="yearDistribution.outlier_count > 0">
              ({{ t('projects.librarian.globalFinder.lowOutliers') }}:
              {{ yearDistribution.low_outlier_count }},
              {{ t('projects.librarian.globalFinder.highOutliers') }}:
              {{ yearDistribution.high_outlier_count }})
            </span>
          </div>
          <div class="col-span-2">
            <span class="text-ppx-text font-medium"
              >{{ t('projects.librarian.globalFinder.modeYears') }}:</span
            >
            {{ yearDistribution.mode_years.join(', ') || '-' }}
          </div>
        </div>
      </div>

      <div v-if="topTags.length > 0" class="workspace-panel-inset space-y-2 rounded-xl p-3">
        <h4 class="workspace-label mb-0">{{ t('projects.librarian.globalFinder.topTags') }}</h4>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in topTags"
            :key="tag.tag"
            class="workspace-badge workspace-badge--neutral text-xs"
          >
            {{ tag.tag }} <span class="text-ppx-text-soft">({{ tag.count }})</span>
          </span>
        </div>
      </div>

      <div class="workspace-panel-inset space-y-2 rounded-xl p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h4 class="workspace-label mb-0">{{ t('projects.summaryTitle') }}</h4>
            <div v-if="isUpdatingAgentSummary" class="flex items-center gap-1.5">
              <LoaderCircle class="text-ppx-accent h-4 w-4 animate-spin" />
              <span class="text-ppx-text-soft text-xs">{{
                t('projects.agentSummaryLoading')
              }}</span>
            </div>
          </div>
          <div v-if="!isEditingAgentSummary" class="flex items-center gap-1">
            <AppButton
              v-if="agentSummary"
              size="xs"
              variant="outline"
              :disabled="isUpdatingAgentSummary"
              @click="((isUpdatingAgentSummary = true), emit('forceAgentSummary'))"
            >
              <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': isUpdatingAgentSummary }" />
            </AppButton>
            <AppButton
              size="xs"
              variant="outline"
              @click="((agentSummaryDraft = agentSummary ?? ''), (isEditingAgentSummary = true))"
            >
              <Pencil class="h-3 w-3" />
            </AppButton>
            <AppButton
              v-if="agentSummary"
              size="xs"
              variant="outline"
              tone="rose"
              @click="emit('delete:agentSummary')"
            >
              <Trash2 class="h-3 w-3" />
            </AppButton>
          </div>
        </div>

        <div v-if="isEditingAgentSummary" class="space-y-2">
          <textarea v-model="agentSummaryDraft" rows="6" class="workspace-textarea text-sm" />
          <div class="flex items-center justify-end gap-2">
            <AppButton size="xs" variant="outline" @click="isEditingAgentSummary = false">{{
              t('projects.actions.cancel')
            }}</AppButton>
            <AppButton
              size="xs"
              variant="solid"
              tone="sky"
              :disabled="isUpdatingAgentSummary"
              @click="
                ((isUpdatingAgentSummary = true),
                emit('update:agentSummary', agentSummaryDraft),
                (isEditingAgentSummary = false))
              "
              >{{ t('projects.actions.save') }}</AppButton
            >
          </div>
        </div>
        <div v-else-if="agentSummary" class="text-ppx-text-soft text-sm">
          <MarkdownContent :markdown="agentSummary" :enable-math="false" />
        </div>
        <div v-else class="text-ppx-text-soft text-sm">
          {{ t('projects.summaryPlaceholder') }}
        </div>
      </div>
    </div>
  </div>
</template>
