<script setup lang="ts">
import { FileCheck2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import type { Dict } from '@/composables/usePaperHelpers'
import { labelize } from '@/composables/usePaperHelpers'

const props = defineProps<{
  hasExtractionFactCheck: boolean
  hasAnalysisFactCheck: boolean
  extractionFactCheckPassed: boolean | null
  extractionFactCheckErrors: (string | Dict)[]
  analysisFactCheckPassed: boolean | null
  analysisFactCheckErrors: (string | Dict)[]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="workspace-panel space-y-3 p-3.5">
    <h3 class="workspace-section-title inline-flex items-center gap-1.5">
      <FileCheck2 class="h-4 w-4" />
      <span>{{ t('paper.sections.factCheck') }}</span>
    </h3>
    <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
      <article class="workspace-subpanel space-y-2 p-2.5">
        <div class="workspace-label mb-0">{{ t('paper.factCheck.extraction') }}</div>
        <template v-if="props.hasExtractionFactCheck">
          <div class="workspace-subpanel space-y-1 p-2.5">
            <div class="workspace-label mb-0">{{ t('paper.factCheck.result') }}</div>
            <div class="workspace-body">
              {{
                props.extractionFactCheckPassed === null
                  ? '-'
                  : props.extractionFactCheckPassed
                    ? t('paper.factCheck.passed')
                    : t('paper.factCheck.failed')
              }}
            </div>
          </div>
          <div v-if="props.extractionFactCheckErrors.length" class="space-y-1.5">
            <div class="workspace-label mb-0">{{ t('paper.factCheck.error') }}</div>
            <article
              v-for="(issue, index) in props.extractionFactCheckErrors"
              :key="`efi-${index}`"
              class="workspace-subpanel p-2.5"
            >
              <template v-if="typeof issue === 'string'">
                <div class="workspace-body">{{ issue }}</div>
              </template>
              <template v-else>
                <div
                  v-for="(value, key) in issue"
                  :key="`efi-${index}-${key}`"
                  class="leading-relaxed"
                >
                  <span class="text-ppx-text-muted font-medium">{{ labelize(String(key)) }}:</span>
                  <span class="text-ppx-text-muted ml-1">{{
                    typeof value === 'string' ? value : JSON.stringify(value)
                  }}</span>
                </div>
              </template>
            </article>
          </div>
          <div v-else class="workspace-body">-</div>
        </template>
        <div v-else class="workspace-body">-</div>
      </article>

      <article class="workspace-subpanel space-y-2 p-2.5">
        <div class="workspace-label mb-0">{{ t('paper.factCheck.analysis') }}</div>
        <template v-if="props.hasAnalysisFactCheck">
          <div class="workspace-subpanel space-y-1 p-2.5">
            <div class="workspace-label mb-0">{{ t('paper.factCheck.result') }}</div>
            <div class="workspace-body">
              {{
                props.analysisFactCheckPassed === null
                  ? '-'
                  : props.analysisFactCheckPassed
                    ? t('paper.factCheck.passed')
                    : t('paper.factCheck.failed')
              }}
            </div>
          </div>
          <div v-if="props.analysisFactCheckErrors.length" class="space-y-1.5">
            <div class="workspace-label mb-0">{{ t('paper.factCheck.error') }}</div>
            <article
              v-for="(issue, index) in props.analysisFactCheckErrors"
              :key="`afi-${index}`"
              class="workspace-subpanel p-2.5"
            >
              <template v-if="typeof issue === 'string'">
                <div class="workspace-body">{{ issue }}</div>
              </template>
              <template v-else>
                <div
                  v-for="(value, key) in issue"
                  :key="`afi-${index}-${key}`"
                  class="leading-relaxed"
                >
                  <span class="text-ppx-text-muted font-medium">{{ labelize(String(key)) }}:</span>
                  <span class="text-ppx-text-muted ml-1">{{
                    typeof value === 'string' ? value : JSON.stringify(value)
                  }}</span>
                </div>
              </template>
            </article>
          </div>
          <div v-else class="workspace-body">-</div>
        </template>
        <div v-else class="workspace-body">-</div>
      </article>
    </div>
  </section>
</template>
