<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, Copy } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { safePrettyJson } from '../utils/format'

const props = defineProps<{
  title: string
  value: unknown
  defaultOpen?: boolean
  preWrap?: boolean
  maxHeight?: string
}>()

const { t } = useI18n()
const open = ref(Boolean(props.defaultOpen))
const text = computed(() => safePrettyJson(props.value))

async function copyToClipboard(): Promise<void> {
  await navigator.clipboard.writeText(text.value)
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
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
    <pre v-if="open"
      class="overflow-auto border-t border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
      :class="props.preWrap ? 'wrap-break-word whitespace-pre-wrap' : 'max-h-80'"
      :style="props.maxHeight ? { maxHeight: props.maxHeight } : undefined">{{ text }}</pre>
  </div>
</template>
