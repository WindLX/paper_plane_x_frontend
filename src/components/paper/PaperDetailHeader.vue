<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, Folder, Link2, Trash2, Unlink2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import type { PaperDetailResponse } from '@/types/api'
import { formatDateTime } from '@/utils/format'
import { useProjectStore } from '@/stores/projects'
import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'
import PaperStatusBadge from './PaperStatusBadge.vue'

const props = defineProps<{
  paper: PaperDetailResponse
  projectId?: string
  unlinkingPaperId?: string | null
  linkingPaperId?: string | null
}>()

const emit = defineEmits<{
  unlink: [paperId: string]
  openProjectLinkModal: []
  delete: [paperId: string]
}>()

const { t } = useI18n()
const projectStore = useProjectStore()

const isInProject = computed<boolean>(() => {
  if (!props.projectId) return false
  return props.paper.project_ids.includes(props.projectId)
})

const paperProjects = computed(() => {
  return props.paper.project_ids
    .map((projectId) => projectStore.projectsById[projectId])
    .filter((project): project is (typeof projectStore.projectsById)[string] => Boolean(project))
})

const customMeta = computed<Record<string, unknown> | null>(() => {
  const raw = props.paper.custom_meta
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

const zoteroKey = computed<string | null>(() => {
  const value = customMeta.value?.zotero_key
  if (typeof value !== 'string' || value.trim().length === 0) return null
  return value.trim()
})

const zoteroUrl = computed<string | null>(() => {
  if (!zoteroKey.value) return null
  return `zotero://select/library/items/${zoteroKey.value}`
})
</script>

<template>
  <header class="workspace-panel space-y-3 p-3.5">
    <h3 class="workspace-section-title">
      {{ paper.title ?? '-' }}
    </h3>
    <div class="flex flex-col justify-between gap-3">
      <CopyableText :text="paper.paper_id" mono />
      <div v-if="paperProjects.length > 0" class="space-y-1.5">
        <div class="workspace-label">{{ t('sidebar.project.project') }}</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="project in paperProjects"
            :key="`paper-project-${project.project_id}`"
            class="workspace-badge inline-flex items-center gap-1.5"
          >
            <Folder class="h-3 w-3" />
            <span>{{ project.name }}</span>
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto">
        <a
          v-if="zoteroUrl"
          :href="zoteroUrl"
          class="border-ppx-border-strong text-ppx-text-soft hover:bg-ppx-bg-subtle hover:text-ppx-text rounded-ppx-interactive inline-flex shrink-0 items-center justify-center gap-1.5 border px-2.5 py-1.5 text-xs font-medium transition-colors"
        >
          <ExternalLink class="h-3.5 w-3.5" />
          <span>Zotero</span>
        </a>
        <AppButton
          v-if="isInProject"
          variant="outline"
          tone="rose"
          size="xs"
          :disabled="unlinkingPaperId === paper.paper_id"
          @click="emit('unlink', paper.paper_id)"
        >
          <Unlink2 class="h-3.5 w-3.5" />
          <span>{{ t('actions.unlink') }}</span>
        </AppButton>
        <AppButton v-else variant="outline" size="xs" @click="emit('openProjectLinkModal')">
          <Link2 class="h-3.5 w-3.5" />
          <span>{{ t('actions.linkToProject') }}</span>
        </AppButton>
        <AppButton variant="outline" tone="rose" size="xs" @click="emit('delete', paper.paper_id)">
          <Trash2 class="h-3.5 w-3.5" />
          <span>{{ t('actions.delete') }}</span>
        </AppButton>
      </div>
    </div>
    <div class="grid gap-2 md:grid-cols-2">
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-0">{{ t('paper.labels.authors') }}</div>
        <div class="workspace-body">{{ paper.authors.join(', ') || '-' }}</div>
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-0">{{ t('paper.labels.publication') }}</div>
        <div class="workspace-body">{{ paper.publication ?? '-' }}</div>
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-0">{{ t('paper.labels.year') }}</div>
        <div class="workspace-body">{{ paper.year ?? '-' }}</div>
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-0">{{ t('paper.labels.doi') }}</div>
        <div class="workspace-body">{{ paper.doi ?? '-' }}</div>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <span class="workspace-badge workspace-badge--neutral"
        >{{ formatDateTime(paper.created_at) }} — {{ formatDateTime(paper.updated_at) }}</span
      >
    </div>
    <div class="flex flex-wrap gap-2">
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
    </div>
    <div class="flex flex-wrap gap-2"></div>
  </header>
</template>
