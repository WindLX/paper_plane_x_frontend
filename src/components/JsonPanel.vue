<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, Copy } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

import { safePrettyJson } from '../utils/format'

const props = defineProps<{
  title: string
  value: unknown
  defaultOpen?: boolean
  maxHeight?: string
}>()

const { t } = useI18n()
const open = ref(Boolean(props.defaultOpen))

const jsonData = computed(() => props.value as any)

const text = computed(() => safePrettyJson(props.value))

async function copyToClipboard(): Promise<void> {
  await navigator.clipboard.writeText(text.value)
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <!-- 标题栏：完全保留原有结构和交互 -->
    <div class="flex items-center justify-between px-3 py-2">
      <button type="button"
        class="inline-flex items-center gap-1.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
        @click="open = !open">
        <ChevronDown v-if="open" class="h-4 w-4" />
        <ChevronRight v-else class="h-4 w-4" />
        <span>{{ title }}</span>
      </button>
      <div class="flex items-center gap-2">
        <button type="button"
          class="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          @click="copyToClipboard">
          <Copy class="h-3.5 w-3.5" />
          <span>{{ t('actions.copy') }}</span>
        </button>
      </div>
    </div>

    <div v-if="open"
      class="overflow-auto border-t border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
      :class="props.maxHeight ? '' : 'max-h-80'" :style="props.maxHeight ? { maxHeight: props.maxHeight } : undefined">
      <VueJsonPretty :data="jsonData" :deep="2" :showLine="true" :showIcon="true" :showLength="true"
        :collapsedOnClickBrackets="true" class="json-pretty" />
    </div>
  </div>
</template>

<style scoped>
/* 字体统一为等宽 */
:deep(.vjs-tree) {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.75rem;
  /* text-xs */
  line-height: 1.5;
}

/* 去掉库自带的背景，让面板背景色接管 */
:deep(.vjs-tree.is-root) {
  background: transparent !important;
}

/* 暗色主题颜色映射到 slate 体系 */
.dark :deep(.vjs-tree) {
  color: #cbd5e1;
  /* slate-300 */
}

.dark :deep(.vjs-key) {
  color: #7dd3fc;
  /* sky-300 */
}

.dark :deep(.vjs-string) {
  color: #86efac;
  /* green-300 */
}

.dark :deep(.vjs-number) {
  color: #fca5a5;
  /* red-300 */
}

.dark :deep(.vjs-boolean) {
  color: #c4b5fd;
  /* violet-300 */
}

.dark :deep(.vjs-null) {
  color: #94a3b8;
  /* slate-400 */
}

.dark :deep(.vjs-brackets) {
  color: #94a3b8;
}

.dark :deep(.vjs-value) {
  color: #cbd5e1;
}

.dark :deep(.vjs-tree-node:hover) {
  background: rgba(255, 255, 255, 0.03);
}
</style>