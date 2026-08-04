<script setup lang="ts">
import { toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import PaperDrawerWorkspace from '@/components/paper/PaperDrawerWorkspace.vue'
import FileDrawerContent from '@/components/project/file-drawer/FileDrawerContent.vue'
import PaperDrawerContent from '@/components/project/paper-drawer/PapersDrawerContent.vue'
import ProjectFileView from '@/components/project/ProjectFileView.vue'
import ProjectPaperView from '@/components/project/ProjectPaperView.vue'
import ProjectDeleteConfirmModal from '@/components/project/ProjectDeleteConfirmModal.vue'
import ProjectTopbarDrawer from '@/components/project/ProjectTopbarDrawer.vue'
import { useProjectPageController } from '@/composables/useProjectPageController'
import { usePaperPdfPane } from '@/composables/usePaperPdfPane'

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const ctrl = useProjectPageController(toRef(props, 'projectId'))
const pdf = usePaperPdfPane()

watch(
  () => [ctrl.paperDrawerPaperId, ctrl.activeTab, ctrl.drawerOpen],
  () => pdf.reset(),
)
</script>

<template>
  <div class="h-full w-full">
    <PageLayout
      :title="ctrl.pageTitle"
      :subtitle="ctrl.pageSubtitle"
      :drawer-open="ctrl.drawerOpen"
      :drawer-expanded="pdf.layoutOpen"
      :drawer-expanded-width="pdf.width"
      no-padding
      @close-drawer="ctrl.closeDrawer"
    >
      <template #topbar-actions>
        <ProjectTopbarDrawer
          :project="ctrl.project"
          :global-finder="ctrl.globalFinder"
          :loading="ctrl.loading"
          :active-tab="ctrl.activeTab"
          @update:agent-summary="ctrl.updateAgentSummary"
          @delete:agent-summary="ctrl.deleteAgentSummary"
          @force-agent-summary="ctrl.forceAgentSummary"
          @update:project="ctrl.updateProject"
          @delete:project="ctrl.openDeleteConfirm"
          @export:project="ctrl.exportProject"
          @open-tab="ctrl.openTab"
        />
      </template>

      <section class="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <template v-if="ctrl.activeTab === 'files'">
          <ProjectFileView
            :project-id="props.projectId"
            @toggle-drawer="ctrl.toggleFileDrawer"
            @open-drawer="ctrl.openFileDrawer"
          />
        </template>
        <template v-else-if="ctrl.activeTab === 'papers'">
          <ProjectPaperView :project-id="props.projectId" @open-drawer="ctrl.openPaperDrawer" />
        </template>
      </section>

      <template #drawer>
        <SlidePanel
          v-if="ctrl.activeTab === 'files'"
          :title="t('projects.projectDrawer.tabPapers')"
          @close="ctrl.closeDrawer"
        >
          <FileDrawerContent
            :project-id="props.projectId"
            :initial-paper-id="ctrl.fileDrawerPaperId"
          />
        </SlidePanel>
        <PaperDrawerWorkspace
          v-else-if="ctrl.activeTab === 'papers'"
          v-model:pdf-width="pdf.width"
          :pdf-open="pdf.open"
          :paper-id="ctrl.paperDrawerPaperId"
          :paper-title="pdf.paperTitle"
          @close-pdf="pdf.close"
          @pdf-closed="pdf.finishClose"
        >
          <SlidePanel :title="t('projects.projectDrawer.tabPapers')" @close="ctrl.closeDrawer">
            <PaperDrawerContent
              :project-id="props.projectId"
              :initial-paper-id="ctrl.paperDrawerPaperId"
              :pdf-open="pdf.open"
              @toggle-pdf="pdf.toggle"
            />
          </SlidePanel>
        </PaperDrawerWorkspace>
      </template>
    </PageLayout>

    <ProjectDeleteConfirmModal
      :open="ctrl.deleteConfirmOpen"
      :project-name="ctrl.project?.name ?? props.projectId"
      :project-id="props.projectId"
      :paper-count="ctrl.globalFinder?.stats?.paper_count ?? 0"
      @close="ctrl.closeDeleteConfirm"
      @confirm="ctrl.confirmDeleteProject"
    />
  </div>
</template>
