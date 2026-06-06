<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { usePaperHelpers, useProjectLinkModal } from '@/composables/usePaperHelpers'
import type { PaperDetailResponse } from '@/types/api'
import JsonPanel from '../JsonPanel.vue'
import PaperAgentNote from './PaperAgentNote.vue'
import PaperAnalysis from './PaperAnalysis.vue'
import PaperDetailHeader from './PaperDetailHeader.vue'
import PaperFactCheck from './PaperFactCheck.vue'
import PaperProjectLinkModal from './PaperProjectLinkModal.vue'
import PaperQuickScan from './PaperQuickScan.vue'
import PaperSynthesis from './PaperSynthesis.vue'

const props = defineProps<{
  paper: PaperDetailResponse | null
}>()

const emit = defineEmits<{
  unlink: [projectId: string]
  linkToProject: [[projectId: string, paperId: string]]
  delete: [paperId: string]
}>()

const { t } = useI18n()

const helpers = usePaperHelpers(props.paper)
const linkModal = useProjectLinkModal(props.paper)

async function handleLinkToProject(projectId: string): Promise<void> {
  if (!props.paper || linkModal.isPaperLinkedToProject(projectId)) return
  emit('linkToProject', [projectId, props.paper.paper_id])
  linkModal.projectLinkModalOpen.value = false
}
</script>

<template>
  <section class="animate-fade-in-up space-y-3.5">
    <template v-if="paper">
      <PaperDetailHeader
        :paper="paper"
        @unlink="emit('unlink', $event)"
        @open-project-link-modal="linkModal.openProjectLinkModal()"
        @delete="emit('delete', $event)"
      />

      <PaperQuickScan
        :has-quick-scan="helpers.hasQuickScan.value"
        :quick-scan-verdict="helpers.quickScanVerdict.value"
        :quick-scan-reason="helpers.quickScanReason.value"
        :quick-scan-summary="helpers.quickScanSummary.value"
        :quick-scan-tags="helpers.quickScanTags.value"
      />

      <PaperSynthesis
        :has-synthesis="helpers.hasSynthesis.value"
        :synthesis-summary="helpers.synthesisSummary.value"
        :synthesis-methodology="helpers.synthesisMethodology.value"
        :synthesis-key-results="helpers.synthesisKeyResults.value"
        :synthesis-gaps="helpers.synthesisGaps.value"
      />

      <PaperAnalysis
        :has-analysis-report="helpers.hasAnalysisReport.value"
        :analysis-prerequisites="helpers.analysisPrerequisites.value"
        :analysis-core-formulation="helpers.analysisCoreFormulation.value"
        :analysis-derivation-steps="helpers.analysisDerivationSteps.value"
        :analysis-related-references="helpers.analysisRelatedReferences.value"
        :analysis-extras="helpers.analysisExtras.value"
      />

      <PaperFactCheck
        :has-extraction-fact-check="helpers.hasExtractionFactCheck.value"
        :has-analysis-fact-check="helpers.hasAnalysisFactCheck.value"
        :extraction-fact-check-passed="helpers.extractionFactCheckPassed.value"
        :extraction-fact-check-errors="helpers.extractionFactCheckErrors.value"
        :analysis-fact-check-passed="helpers.analysisFactCheckPassed.value"
        :analysis-fact-check-errors="helpers.analysisFactCheckErrors.value"
      />

      <PaperAgentNote :agent-note="paper.agent_note" />

      <section class="workspace-panel p-3.5">
        <JsonPanel
          :title="t('paper.rawPaperJson')"
          :value="paper"
          :default-open="false"
          max-height="34vh"
        />
      </section>
    </template>
    <div v-else class="workspace-subpanel workspace-body p-4 text-sm">
      {{ t('paper.noPaperSelected') }}
    </div>

    <PaperProjectLinkModal
      v-if="linkModal.projectLinkModalOpen.value && paper"
      v-model:project-keyword="linkModal.projectKeyword.value"
      :open="linkModal.projectLinkModalOpen.value"
      :paper-id="paper.paper_id"
      :available-projects="linkModal.filteredProjects.value"
      :project-search-loading="linkModal.projectSearchLoading.value"
      :is-paper-linked-to-project="linkModal.isPaperLinkedToProject"
      @link-to-project="handleLinkToProject"
      @close="linkModal.projectLinkModalOpen.value = false"
    />
  </section>
</template>
