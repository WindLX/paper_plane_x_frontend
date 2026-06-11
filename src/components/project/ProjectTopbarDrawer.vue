<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import ProjectTopbarActions from './project-drawer/ProjectTopbarActions.vue'
import ProjectPanelShell from './project-drawer/ProjectPanelShell.vue'
import ProjectOverviewPanel from './project-drawer/ProjectOverviewPanel.vue'
import ProjectExportPanel from './project-drawer/ProjectExportPanel.vue'
import ProjectEditPanel from './project-drawer/ProjectEditPanel.vue'
import ProjectLogsPanel from './project-drawer/ProjectLogsPanel.vue'
import type {
  ProjectResponse,
  LibrarianGlobalFinderResponse,
  ProjectExportField,
  ProjectExportRequest,
} from '@/types/api'
import type { ProjectPageTab } from '@/composables/useProjectPageController'

const props = defineProps<{
  project: ProjectResponse | null
  globalFinder: LibrarianGlobalFinderResponse | null
  loading: boolean
  hasConversation?: boolean
  activeTab: ProjectPageTab
}>()

const emit = defineEmits<{
  'update:agentSummary': [content: string]
  'delete:agentSummary': []
  forceAgentSummary: []
  'update:project': [payload: { name?: string | null; description?: string | null }]
  'delete:project': []
  'export:project': [payload: ProjectExportRequest]
  openTab: [tab: ProjectPageTab]
}>()

const { t } = useI18n()

const activePanel = ref<string | null>(null)
const exporting = ref(false)

// Export state
const selectedFields = ref<ProjectExportField[]>([
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
])
const citationsMode = ref<'keep' | 'strip'>('keep')
const includeSandboxFiles = ref(true)

// Edit state
const editName = ref('')
const editDescription = ref('')

const panelTitle = computed(() => {
  switch (activePanel.value) {
    case 'overview':
      return t('projects.overview')
    case 'export':
      return t('projects.exportPanelTitle')
    case 'edit':
      return t('projects.editPanelTitle')
    case 'logs':
      return t('projects.logsPanelTitle')
    default:
      return ''
  }
})

function openPanel(name: string): void {
  activePanel.value = name
  if (name === 'edit' && props.project) {
    editName.value = props.project.name
    editDescription.value = props.project.description ?? ''
  }
}

function closePanel(): void {
  activePanel.value = null
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') closePanel()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleExport(payload: ProjectExportRequest): void {
  exporting.value = true
  emit('export:project', payload)
}

function handleSaveProject(payload: { name: string | null; description: string | null }): void {
  emit('update:project', payload)
  closePanel()
}
</script>

<template>
  <ProjectTopbarActions
    :active-panel="activePanel"
    :active-tab="activeTab"
    @open-panel="openPanel"
    @open-tab="emit('openTab', $event)"
    @delete-project="emit('delete:project')"
  />

  <ProjectPanelShell :open="!!activePanel" :title="panelTitle" @close="closePanel">
    <ProjectOverviewPanel
      v-if="activePanel === 'overview'"
      :project="project"
      :global-finder="globalFinder"
      :loading="loading"
      @update:agent-summary="emit('update:agentSummary', $event)"
      @delete:agent-summary="emit('delete:agentSummary')"
      @force-agent-summary="emit('forceAgentSummary')"
    />

    <ProjectExportPanel
      v-else-if="activePanel === 'export'"
      v-model:selected-fields="selectedFields"
      v-model:citations-mode="citationsMode"
      v-model:include-sandbox-files="includeSandboxFiles"
      :exporting="exporting"
      @export="handleExport"
    />

    <ProjectEditPanel
      v-else-if="activePanel === 'edit'"
      v-model:name="editName"
      v-model:description="editDescription"
      @save="handleSaveProject"
    />

    <ProjectLogsPanel v-else-if="activePanel === 'logs' && project" :project="project" />

    <div v-else class="text-ppx-text-soft py-8 text-center text-sm">
      {{ t('projects.chatDrawer.empty') }}
    </div>
  </ProjectPanelShell>
</template>
