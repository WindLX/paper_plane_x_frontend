<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import MarkdownContent from '../MarkdownContent.vue'
import JsonPanel from '../JsonPanel.vue'
import type { TraceMessage } from '../../types/api'

const props = defineProps<{
  message: TraceMessage
  index?: number
}>()

const { t } = useI18n()

const roleCardClass = computed(() => {
  switch (props.message.role) {
    case 'system':
      return 'border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
    case 'assistant':
      return 'border-sky-200 bg-sky-50 dark:border-sky-700 dark:bg-sky-900/20'
    case 'tool':
      return 'border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
    default:
      return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
  }
})

const roleAlignClass = computed(() => {
  if (props.message.role === 'assistant') return 'mr-auto max-w-[78%]'
  return 'ml-auto max-w-[78%]'
})

const roleLabelClass = computed(() => {
  if (props.message.role === 'system') return 'text-indigo-700 dark:text-indigo-300'
  if (props.message.role === 'assistant') return 'text-sky-700 dark:text-sky-300'
  if (props.message.role === 'tool') return 'text-emerald-700 dark:text-emerald-300'
  return 'text-slate-700 dark:text-slate-200'
})

const reasoningClass = computed(() => {
  if (props.message.role === 'assistant') {
    return 'border-sky-300 bg-sky-100/80 dark:border-sky-700 dark:bg-sky-900/30'
  }
  if (props.message.role === 'system') {
    return 'border-indigo-300 bg-indigo-100/80 dark:border-indigo-700 dark:bg-indigo-900/30'
  }
  return 'border-slate-300 bg-slate-100/80 dark:border-slate-600 dark:bg-slate-800/70'
})

type TextPart = { type: 'text'; text: string }
type ImagePart = { type: 'image'; url: string }

const parsedParts = computed<(TextPart | ImagePart)[]>(() => {
  const content = props.message.content
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }]
  }
  if (!Array.isArray(content)) {
    return []
  }

  const parts: (TextPart | ImagePart)[] = []
  for (const item of content) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const part = item as Record<string, unknown>
    const partType = typeof part.type === 'string' ? part.type : ''

    if (partType === 'text' && typeof part.text === 'string') {
      parts.push({ type: 'text', text: part.text })
      continue
    }

    if (partType === 'image_url') {
      const imageUrl = part.image_url
      if (typeof imageUrl === 'string') {
        parts.push({ type: 'image', url: imageUrl })
        continue
      }
      if (
        typeof imageUrl === 'object' &&
        imageUrl !== null &&
        typeof (imageUrl as Record<string, unknown>).url === 'string'
      ) {
        parts.push({
          type: 'image',
          url: (imageUrl as Record<string, string>).url,
        })
      }
      continue
    }

    if (partType === 'image' && typeof part.url === 'string') {
      parts.push({ type: 'image', url: part.url })
    }
  }
  return parts
})

const hasReasoning = computed(
  () => typeof props.message.reasoning_content === 'string' && props.message.reasoning_content.length > 0,
)

const previewText = computed(() => {
  const firstText = parsedParts.value.find((item) => item.type === 'text')
  if (!firstText) {
    return parsedParts.value.length > 0 ? t('trace.multimodalMessage') : t('trace.emptyContent')
  }
  const text = firstText.text.replace(/\s+/g, ' ').trim()
  if (text.length <= 80) return text
  return `${text.slice(0, 80)}...`
})
</script>

<template>
  <details class="group rounded-lg border" :class="[roleAlignClass, roleCardClass]">
    <summary class="summary-row cursor-pointer list-none p-3">
      <div class="flex items-start gap-2">
        <div class="mt-1.5 h-2 w-2 rounded-full bg-slate-400/80 dark:bg-slate-500" />
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" :class="roleLabelClass">
            <ChevronRight class="h-4 w-4 transition-transform group-open:rotate-90" />
            <span>#{{ index ?? '-' }} {{ t(`trace.role.${message.role}`) }}</span>
            <span v-if="message.name" class="normal-case text-xs font-medium text-slate-500">({{ message.name }})</span>
          </div>
          <p class="preview-text mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {{ previewText }}
          </p>
        </div>
      </div>
    </summary>

    <div class="space-y-3 px-3 pb-3 pt-2">
      <details v-if="hasReasoning" class="rounded-md border p-2" :class="reasoningClass">
        <summary class="cursor-pointer text-xs font-semibold">{{ t('trace.reasoning') }}</summary>
        <div class="mt-2">
          <MarkdownContent :markdown="message.reasoning_content as string" />
        </div>
      </details>

      <div v-if="parsedParts.length === 0" class="text-xs text-slate-500 dark:text-slate-400">
        {{ t('trace.emptyContent') }}
      </div>

      <div class="space-y-3">
        <template v-for="(part, index2) in parsedParts" :key="index2">
          <MarkdownContent v-if="part.type === 'text'" :markdown="part.text" />
          <div v-else class="space-y-2">
            <img :src="part.url" :alt="t('trace.vlmImageAlt')" loading="lazy"
              class="max-h-80 w-auto rounded border border-slate-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-900" />
            <a :href="part.url" target="_blank" rel="noreferrer"
              class="text-xs text-sky-700 underline dark:text-sky-300">
              {{ t('trace.openImage') }}
            </a>
          </div>
        </template>
      </div>

      <JsonPanel :title="t('trace.rawMessageJson')" :value="message" />
    </div>
  </details>
</template>

<style scoped>
.group[open] .preview-text {
  display: none;
}

.summary-row {
  border-bottom: 1px solid transparent;
}

.group[open] .summary-row {
  border-bottom-color: rgb(226 232 240);
}

.dark .group[open] .summary-row {
  border-bottom-color: rgb(51 65 85);
}
</style>
