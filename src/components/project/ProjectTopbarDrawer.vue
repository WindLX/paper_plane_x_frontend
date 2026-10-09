<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ProjectEditPanel from './project-drawer/ProjectEditPanel.vue'
import ProjectExportPanel from './project-drawer/ProjectExportPanel.vue'
import ProjectPanelShell from './project-drawer/ProjectPanelShell.vue'
import ProjectTopbarActions from './project-drawer/ProjectTopbarActions.vue'
import type { BlobTransferProgress } from '@/api/core'
import type { ProjectPageTab } from '@/composables/useProjectPageController'
import type {
  ProjectExportField,
  ProjectExportJob,
  ProjectExportRequest,
  ProjectResponse,
} from '@/types/api'

const props = withDefaults(
  defineProps<{
    project: ProjectResponse | null
    activeTab: ProjectPageTab
    exportJobs?: ProjectExportJob[]
    exportSubmitting?: boolean
    exportError?: string | null
    downloadingExportId?: string | null
    downloadProgress?: BlobTransferProgress | null
  }>(),
  {
    exportJobs: () => [],
    exportSubmitting: false,
    exportError: null,
    downloadingExportId: null,
    downloadProgress: null,
  },
)

const emit = defineEmits<{
  'update:project': [payload: { name?: string | null; description?: string | null }]
  'delete:project': []
  'export:project': [payload: ProjectExportRequest]
  openTab: [tab: ProjectPageTab]
  cancelExport: [exportId: string]
  downloadExport: [exportId: string]
  stopExportDownload: []
  refreshExports: []
}>()

const { t } = useI18n()

const activePanel = ref<'export' | 'edit' | null>(null)

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

const editName = ref('')
const editDescription = ref('')

const panelTitle = computed(() => {
  if (activePanel.value === 'export') return t('projects.exportPanelTitle')
  if (activePanel.value === 'edit') return t('projects.editPanelTitle')
  return ''
})

function openPanel(name: 'export' | 'edit'): void {
  activePanel.value = name
  if (name === 'edit' && props.project) {
    editName.value = props.project.name
    editDescription.value = props.project.description ?? ''
  }
}

function closePanel(): void {
  activePanel.value = null
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closePanel()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleExport(payload: ProjectExportRequest): void {
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
    :active-tab="props.activeTab"
    @open-panel="openPanel"
    @open-tab="emit('openTab', $event)"
    @delete-project="emit('delete:project')"
  />

  <ProjectPanelShell :open="!!activePanel" :title="panelTitle" @close="closePanel">
    <ProjectExportPanel
      v-if="activePanel === 'export'"
      v-model:selected-fields="selectedFields"
      v-model:citations-mode="citationsMode"
      v-model:include-sandbox-files="includeSandboxFiles"
      :exporting="props.exportSubmitting"
      :export-jobs="props.exportJobs"
      :export-error="props.exportError"
      :downloading-export-id="props.downloadingExportId"
      :download-progress="props.downloadProgress"
      @export="handleExport"
      @cancel-export="emit('cancelExport', $event)"
      @download-export="emit('downloadExport', $event)"
      @stop-export-download="emit('stopExportDownload')"
      @refresh-exports="emit('refreshExports')"
    />

    <ProjectEditPanel
      v-else-if="activePanel === 'edit'"
      v-model:name="editName"
      v-model:description="editDescription"
      @save="handleSaveProject"
    />
  </ProjectPanelShell>
</template>
