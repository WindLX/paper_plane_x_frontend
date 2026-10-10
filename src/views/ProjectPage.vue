<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useI18n } from 'vue-i18n'

import PageLayout from '@/components/layout/PageLayout.vue'
import CopyableText from '@/components/CopyableText.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import PaperPdfReader from '@/components/paper/PaperPdfReader.vue'
import ProjectActivityView from '@/components/project/ProjectActivityView.vue'
import FileDrawerContent from '@/components/project/file-drawer/FileDrawerContent.vue'
import PaperDrawerContent from '@/components/project/paper-drawer/PapersDrawerContent.vue'
import ProjectDeleteConfirmModal from '@/components/project/ProjectDeleteConfirmModal.vue'
import ProjectFileView from '@/components/project/ProjectFileView.vue'
import ProjectOverviewPanel from '@/components/project/project-drawer/ProjectOverviewPanel.vue'
import ProjectPaperView from '@/components/project/ProjectPaperView.vue'
import ProjectTopbarDrawer from '@/components/project/ProjectTopbarDrawer.vue'
import TaskDrawerContent from '@/components/task/TaskDrawerContent.vue'
import TraceDrawerContent from '@/components/trace/TraceDrawerContent.vue'
import { useTasksWsStore } from '@/stores/tasksWs'
import { usePaperPdfPane } from '@/composables/usePaperPdfPane'
import {
  useProjectPageController,
  type ProjectPageTab,
} from '@/composables/useProjectPageController'

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const ctrl = useProjectPageController(toRef(props, 'projectId'))
const pdf = usePaperPdfPane()
const taskUpdates = useTasksWsStore()
watch(
  () => taskUpdates.lastUpdatedTask,
  () => {
    if (ctrl.activeTab === 'overview') void ctrl.overview.load()
  },
)

const pdfPaperId = computed(() => {
  if (ctrl.activeTab === 'files') return ctrl.fileDrawerPaperId
  if (ctrl.activeTab === 'papers') return ctrl.paperDrawerPaperId
  if (ctrl.activeTab === 'activity' && ctrl.activityDrawerKind === 'paper') {
    return ctrl.activityDrawerId
  }
  return null
})

const fileView = ref<InstanceType<typeof ProjectFileView> | null>(null)
const overviewView = ref<InstanceType<typeof ProjectOverviewPanel> | null>(null)

async function ensureSummaryCanLeave(): Promise<boolean> {
  return ctrl.activeTab !== 'overview' || (await overviewView.value?.ensureCanLeave()) !== false
}
onBeforeRouteLeave(ensureSummaryCanLeave)
onBeforeRouteUpdate(ensureSummaryCanLeave)

async function openTab(tab: ProjectPageTab): Promise<void> {
  if (tab === ctrl.activeTab) return
  if (ctrl.activeTab === 'files' && !(await fileView.value?.ensureCanLeave())) return
  if (ctrl.activeTab === 'overview' && !(await overviewView.value?.ensureCanLeave())) return
  ctrl.openTab(tab)
}

async function openFile(filePath: string): Promise<void> {
  if (!(await ensureSummaryCanLeave())) return
  if (ctrl.activeTab === 'files' && !(await fileView.value?.ensureCanLeave())) return
  ctrl.openFileDeepLink(filePath)
}

async function openPaper(paperId: string): Promise<void> {
  if (!(await ensureSummaryCanLeave())) return
  ctrl.openPaperDrawer(paperId)
}

async function openActivity(activityId?: string): Promise<void> {
  if (!(await ensureSummaryCanLeave())) return
  if (activityId) ctrl.openActivityDeepLink(activityId)
  else await openTab('activity')
}

function handlePapersRemoved(paperIds: string[]): void {
  if (ctrl.paperDrawerPaperId && paperIds.includes(ctrl.paperDrawerPaperId)) {
    ctrl.closePaperDrawer()
    pdf.reset()
  }
  void ctrl.loadData()
}

async function confirmDeleteProject(): Promise<void> {
  if (!(await ensureSummaryCanLeave())) return
  if (ctrl.activeTab === 'files' && !(await fileView.value?.ensureCanLeave())) return
  await ctrl.confirmDeleteProject()
}

watch(
  () => [
    ctrl.paperDrawerPaperId,
    ctrl.fileDrawerPaperId,
    ctrl.activeTab,
    ctrl.drawerOpen,
    ctrl.activityDrawerKind,
    ctrl.activityDrawerId,
  ],
  () => pdf.reset(),
)
</script>

<template>
  <div class="h-full w-full min-w-0 flex-1">
    <PageLayout
      v-model:drawer-expanded-width="pdf.width"
      :title="ctrl.pageTitle"
      :subtitle="ctrl.pageSubtitle"
      :drawer-open="ctrl.drawerOpen"
      :drawer-expanded="pdf.open"
      no-padding
      @close-drawer="ctrl.closeDrawer"
    >
      <template #topbar-title-suffix>
        <span class="inline-flex min-w-9">
          <CopyableText
            :text="props.projectId"
            mono
            class="[&>span]:truncate"
            :title="`${t('projects.projectId')}: ${props.projectId}`"
          />
        </span>
      </template>
      <template #topbar-actions>
        <ProjectTopbarDrawer
          :project="ctrl.project"
          :active-tab="ctrl.activeTab"
          :export-jobs="ctrl.exports.jobs"
          :export-submitting="ctrl.exports.submitting"
          :export-error="ctrl.exports.error"
          :downloading-export-id="ctrl.exports.downloadingExportId"
          :download-progress="ctrl.exports.downloadProgress"
          @update:project="ctrl.updateProject"
          @delete:project="ctrl.openDeleteConfirm"
          @export:project="ctrl.exportProject"
          @cancel-export="ctrl.exports.cancel"
          @download-export="ctrl.exports.download"
          @stop-export-download="ctrl.exports.stopDownload"
          @refresh-exports="ctrl.exports.load"
          @open-tab="openTab"
        />
      </template>

      <section class="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <ProjectOverviewPanel
          v-if="ctrl.activeTab === 'overview'"
          ref="overviewView"
          :loading="ctrl.overview.loading"
          :error="ctrl.overview.error"
          :stats="ctrl.overview.stats"
          :attention-items="ctrl.overview.attentionItems"
          :recent-papers="ctrl.overview.recentPapers"
          :recent-files="ctrl.overview.recentFiles"
          :recent-activities="ctrl.overview.recentActivities"
          :top-tags="ctrl.overview.topTags"
          :year-distribution="ctrl.overview.yearDistribution"
          :year-range="ctrl.overview.yearRange"
          :section-errors="ctrl.overview.sectionErrors"
          :agent-summary="ctrl.overview.agentSummary"
          :summary-updating="ctrl.summaryUpdating"
          :summary-error="ctrl.summaryError"
          @retry="ctrl.overview.load"
          @update:agent-summary="ctrl.updateAgentSummary"
          @delete:agent-summary="ctrl.deleteAgentSummary"
          @force-agent-summary="ctrl.forceAgentSummary"
          @open-paper="openPaper"
          @open-file="openFile"
          @open-activity="openActivity"
        />

        <ProjectActivityView
          v-else-if="ctrl.activeTab === 'activity'"
          :project-id="props.projectId"
          :initial-activity-id="ctrl.routeActivityId"
          @open-task="ctrl.openActivityTask"
          @open-trace="ctrl.openActivityTrace"
          @open-paper="ctrl.openActivityPaper"
          @open-file="openFile"
        />

        <template v-else-if="ctrl.activeTab === 'files'">
          <ProjectFileView
            ref="fileView"
            :project-id="props.projectId"
            :initial-file-path="ctrl.routeFilePath"
            @open-drawer="ctrl.openFileDrawer"
          />
        </template>
        <template v-else-if="ctrl.activeTab === 'papers'">
          <ProjectPaperView
            :project-id="props.projectId"
            @open-drawer="ctrl.openPaperDrawer"
            @papers-removed="handlePapersRemoved"
          />
        </template>
      </section>

      <template #pdf>
        <PaperPdfReader
          v-if="pdfPaperId"
          :paper-id="pdfPaperId"
          :paper-title="pdf.paperTitle"
          @close="pdf.close"
        />
      </template>
      <template #drawer>
        <SlidePanel
          v-if="ctrl.activeTab === 'files'"
          :title="t('projects.projectDrawer.tabPapers')"
          @close="ctrl.closeDrawer"
        >
          <FileDrawerContent
            :project-id="props.projectId"
            :initial-paper-id="ctrl.fileDrawerPaperId"
            :pdf-open="pdf.open"
            @toggle-pdf="pdf.toggle"
          />
        </SlidePanel>
        <SlidePanel
          v-else-if="ctrl.activeTab === 'papers'"
          :title="t('projects.projectDrawer.tabPapers')"
          @close="ctrl.closeDrawer"
        >
          <PaperDrawerContent
            :project-id="props.projectId"
            :initial-paper-id="ctrl.paperDrawerPaperId"
            :pdf-open="pdf.open"
            @toggle-pdf="pdf.toggle"
          />
        </SlidePanel>
        <SlidePanel
          v-else-if="ctrl.activeTab === 'activity' && ctrl.activityDrawerKind === 'task'"
          :title="t('tasks.title')"
          @close="ctrl.closeActivityDrawer"
        >
          <TaskDrawerContent :task-id="ctrl.activityDrawerId ?? ''" />
        </SlidePanel>
        <SlidePanel
          v-else-if="ctrl.activeTab === 'activity' && ctrl.activityDrawerKind === 'trace'"
          :title="t('traces.title')"
          @close="ctrl.closeActivityDrawer"
        >
          <TraceDrawerContent :trace-id="ctrl.activityDrawerId ?? ''" />
        </SlidePanel>
        <SlidePanel
          v-else-if="ctrl.activeTab === 'activity' && ctrl.activityDrawerKind === 'paper'"
          :title="t('projects.projectDrawer.tabPapers')"
          @close="ctrl.closeActivityDrawer"
        >
          <PaperDrawerContent
            :project-id="props.projectId"
            :initial-paper-id="ctrl.activityDrawerId"
            :pdf-open="pdf.open"
            @toggle-pdf="pdf.toggle"
          />
        </SlidePanel>
      </template>
    </PageLayout>

    <ProjectDeleteConfirmModal
      :open="ctrl.deleteConfirmOpen"
      :project-name="ctrl.project?.name ?? props.projectId"
      :project-id="props.projectId"
      :paper-count="ctrl.overview.stats?.paper_count ?? 0"
      @close="ctrl.closeDeleteConfirm"
      @confirm="confirmDeleteProject"
    />
  </div>
</template>
