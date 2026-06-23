<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import type { CitedBlock, SectionCard } from '@/composables/usePaperHelpers'
import MarkdownContent from '../MarkdownContent.vue'
import CitationsBlock from './CitationsBlock.vue'
import SectionCardList from './SectionCardList.vue'

const props = defineProps<{
  hasSynthesis: boolean
  synthesisSummary: CitedBlock | null
  synthesisMethodology: SectionCard[]
  synthesisKeyResults: SectionCard[]
  synthesisGaps: SectionCard[]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="workspace-panel space-y-3 p-3.5">
    <h3 class="workspace-section-title inline-flex items-center gap-1.5">
      <CheckCircle2 class="h-4 w-4" />
      <span>{{ t('paper.sections.synthesisData') }}</span>
    </h3>
    <template v-if="props.hasSynthesis">
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.synthesis.reviewSummary') }}</div>
        <MarkdownContent :markdown="props.synthesisSummary?.text ?? '-'" />
        <CitationsBlock :citations="props.synthesisSummary?.citations ?? []" />
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.synthesis.methodology') }}</div>
        <SectionCardList
          :cards="props.synthesisMethodology"
          :empty-text="t('paper.generic.noData')"
        />
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.synthesis.keyResults') }}</div>
        <SectionCardList
          :cards="props.synthesisKeyResults"
          :empty-text="t('paper.generic.noData')"
        />
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.synthesis.researchGaps') }}</div>
        <SectionCardList :cards="props.synthesisGaps" :empty-text="t('paper.generic.noData')" />
      </div>
    </template>
    <div v-else class="workspace-body">-</div>
  </section>
</template>
