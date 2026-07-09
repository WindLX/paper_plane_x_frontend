<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

import { safePrettyJson } from '@/utils/format'
import { useCopyable } from '@/composables/useCopyable'

const props = defineProps<{
  title: string
  value: unknown
  defaultOpen?: boolean
  maxHeight?: string
}>()

const { t } = useI18n()
const open = ref(Boolean(props.defaultOpen))

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

const jsonData = computed(() => props.value as JsonValue)

const text = computed(() => safePrettyJson(props.value))
const copy = useCopyable()
</script>

<template>
  <section class="workspace-panel-inset overflow-hidden">
    <div class="border-ppx-border flex items-center justify-between border-b px-3 py-2.5">
      <button
        type="button"
        class="text-ppx-text inline-flex cursor-pointer items-center gap-1.5 text-left text-sm font-semibold tracking-tight"
        @click="open = !open"
      >
        <ChevronDown v-if="open" class="text-ppx-text-muted h-4 w-4" />
        <ChevronRight v-else class="text-ppx-text-muted h-4 w-4" />
        <span>{{ title }}</span>
      </button>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Copy JSON"
          class="rounded-ppx-interactive text-ppx-text-soft duration-ppx-fast hover:bg-ppx-bg-subtle border-ppx-border inline-flex cursor-pointer items-center gap-1 border px-2 py-1 text-xs transition-colors"
          @click="copy.copyToClipboard(text)"
        >
          <Check v-if="copy.copied" class="h-3.5 w-3.5" />
          <Copy v-else class="h-3.5 w-3.5" />
          <span>{{ t('actions.copy') }}</span>
        </button>
      </div>
    </div>

    <div
      class="duration-ppx-standard ease-ppx-emphasis grid transition-all"
      :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <div
          v-if="open"
          class="bg-ppx-bg-inset/72 overflow-auto px-3 py-2.5"
          :style="props.maxHeight ? { maxHeight: props.maxHeight } : undefined"
        >
          <VueJsonPretty
            :data="jsonData"
            :deep="2"
            :show-line="true"
            :show-icon="true"
            :show-length="true"
            :collapsed-on-click-brackets="true"
            class="json-pretty"
          />
        </div>
      </div>
    </div>
  </section>
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
