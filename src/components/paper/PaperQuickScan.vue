<script setup lang="ts">
import { ScanSearch } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import MarkdownContent from '../MarkdownContent.vue'

const props = defineProps<{
  hasQuickScan: boolean
  quickScanVerdict: string | null
  quickScanReason: string | null
  quickScanSummary: string | null
  quickScanTags: string[]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="workspace-panel space-y-3 p-3.5">
    <h3 class="workspace-section-title inline-flex items-center gap-1.5">
      <ScanSearch class="h-4 w-4" />
      <span>{{ t('paper.sections.quickScan') }}</span>
    </h3>
    <template v-if="props.hasQuickScan">
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.quickScan.verdict') }}</div>
        <div class="workspace-body">{{ props.quickScanVerdict ?? '-' }}</div>
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.quickScan.reason') }}</div>
        <div class="workspace-body">{{ props.quickScanReason ?? '-' }}</div>
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.quickScan.summary') }}</div>
        <MarkdownContent :markdown="props.quickScanSummary ?? '-'" />
      </div>
      <div class="workspace-subpanel p-2.5">
        <div class="workspace-label mb-1">{{ t('paper.quickScan.tags') }}</div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in props.quickScanTags"
            :key="tag"
            class="workspace-badge workspace-badge--neutral px-2 py-0.5 text-xs"
          >
            {{ tag }}
          </span>
          <span v-if="props.quickScanTags.length === 0" class="workspace-body">-</span>
        </div>
      </div>
    </template>
    <div v-else class="workspace-body">-</div>
  </section>
</template>
