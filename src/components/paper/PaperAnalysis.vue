<script setup lang="ts">
import { FileCheck2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import type { CitedBlock } from '@/composables/usePaperHelpers'
import MarkdownContent from '../MarkdownContent.vue'
import CitationsBlock from './CitationsBlock.vue'

const props = defineProps<{
  hasAnalysisReport: boolean
  analysisPrerequisites: Array<{
    conceptName: string
    briefExplanation: string
    relevance: CitedBlock | null
  }>
  analysisCoreFormulation: {
    problemDefinition: CitedBlock | null
    objectiveFunction: CitedBlock | null
    algorithmFlow: CitedBlock | null
  }
  analysisDerivationSteps: Array<{
    stepOrder: number | null
    stepName: string
    detail: CitedBlock | null
  }>
  analysisRelatedReferences: Array<{ title: string; reason: string }>
  analysisExtras: Array<{ key: string; label: string; value: string }>
}>()

const { t } = useI18n()
</script>

<template>
  <section class="workspace-panel space-y-3 p-3.5">
    <h3 class="workspace-section-title inline-flex items-center gap-1.5">
      <FileCheck2 class="h-4 w-4" />
      <span>{{ t('projectDetail.sections.analysisReport') }}</span>
    </h3>
    <template v-if="props.hasAnalysisReport">
      <div class="workspace-subpanel space-y-2 p-2.5">
        <div class="workspace-label mb-0">{{ t('projectDetail.analysis.prerequisites') }}</div>
        <div v-if="props.analysisPrerequisites.length" class="space-y-2">
          <article
            v-for="(item, index) in props.analysisPrerequisites"
            :key="`prereq-${index}`"
            class="workspace-subpanel p-2.5"
          >
            <div class="workspace-section-title text-sm">{{ item.conceptName }}</div>
            <MarkdownContent class="mt-1" :markdown="item.briefExplanation" />
            <div v-if="item.relevance" class="mt-2">
              <div class="workspace-label mb-1">
                {{ t('projectDetail.analysis.relevance') }}
              </div>
              <MarkdownContent :markdown="item.relevance.text || '-'" />
              <CitationsBlock
                :citations="item.relevance.citations"
                panel-class="text-ppx-text-soft"
              />
            </div>
          </article>
        </div>
        <div v-else class="workspace-body">-</div>
      </div>

      <div class="space-y-2">
        <article class="workspace-subpanel p-2.5">
          <div class="workspace-label mb-1">
            {{ t('projectDetail.analysis.problemDefinition') }}
          </div>
          <MarkdownContent
            :markdown="props.analysisCoreFormulation.problemDefinition?.text ?? '-'"
          />
        </article>
        <article class="workspace-subpanel p-2.5">
          <div class="workspace-label mb-1">
            {{ t('projectDetail.analysis.objectiveFunction') }}
          </div>
          <MarkdownContent
            :markdown="props.analysisCoreFormulation.objectiveFunction?.text ?? '-'"
          />
        </article>
        <article class="workspace-subpanel p-2.5">
          <div class="workspace-label mb-1">
            {{ t('projectDetail.analysis.algorithmFlow') }}
          </div>
          <MarkdownContent :markdown="props.analysisCoreFormulation.algorithmFlow?.text ?? '-'" />
        </article>
      </div>

      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">
          {{ t('projectDetail.analysis.derivationSteps') }}
        </div>
        <div v-if="props.analysisDerivationSteps.length" class="space-y-2">
          <article
            v-for="(step, index) in props.analysisDerivationSteps"
            :key="`step-${index}`"
            class="workspace-subpanel p-2.5"
          >
            <div class="workspace-section-title text-sm">
              <span v-if="step.stepOrder !== null"
                >{{ t('projectDetail.analysis.step') }} {{ step.stepOrder }} · </span
              >{{ step.stepName }}
            </div>
            <MarkdownContent class="mt-1" :markdown="step.detail?.text ?? '-'" />
            <CitationsBlock
              v-if="step.detail?.citations.length"
              :citations="step.detail.citations"
              panel-class="text-ppx-text-soft"
            />
          </article>
        </div>
        <div v-else class="workspace-body">-</div>
      </div>

      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">
          {{ t('projectDetail.analysis.relatedReferences') }}
        </div>
        <div v-if="props.analysisRelatedReferences.length" class="space-y-2">
          <article
            v-for="(refItem, index) in props.analysisRelatedReferences"
            :key="`ref-${index}`"
            class="bg-ppx-bg-elevated/60 rounded-md px-2.5 py-2"
          >
            <div class="text-ppx-text text-sm font-semibold">{{ refItem.title }}</div>
            <MarkdownContent class="mt-1" :markdown="refItem.reason" />
          </article>
        </div>
        <div v-else class="workspace-body">-</div>
      </div>

      <div v-if="props.analysisExtras.length" class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('projectDetail.analysis.additional') }}</div>
        <div class="space-y-1.5">
          <div v-for="item in props.analysisExtras" :key="item.key" class="text-sm">
            <span class="text-ppx-text-soft font-medium">{{ item.label }}:</span>
            <span class="text-ppx-text-soft ml-1">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="workspace-body">-</div>
  </section>
</template>
