<script setup lang="ts">
import { NotebookPen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import MarkdownContent from '../MarkdownContent.vue'

const props = defineProps<{
  agentNote: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <section class="workspace-panel space-y-3 p-3.5">
    <h3 class="workspace-section-title inline-flex items-center gap-1.5">
      <NotebookPen class="h-4 w-4" />
      <span>{{ t('projectDetail.sections.agentNote') }}</span>
    </h3>
    <div v-if="props.agentNote" class="workspace-subpanel p-2.5">
      <MarkdownContent :markdown="props.agentNote" />
    </div>
    <div v-else class="workspace-body">-</div>
  </section>
</template>
