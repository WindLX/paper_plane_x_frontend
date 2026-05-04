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

const roleAccent = computed(() => {
  switch (props.message.role) {
    case 'system':
      return 'var(--ppx-info)'
    case 'assistant':
      return 'var(--ppx-accent)'
    case 'tool':
      return 'var(--ppx-success)'
    default:
      return 'var(--ppx-warning)'
  }
})

const roleAlignClass = computed(() => {
  if (props.message.role === 'assistant') return 'mr-auto max-w-[78%]'
  return 'ml-auto max-w-[78%]'
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
  () =>
    typeof props.message.reasoning_content === 'string' &&
    props.message.reasoning_content.length > 0,
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
  <details
    class="group workspace-panel animate-fade-in-up overflow-hidden p-0"
    :class="roleAlignClass"
    :style="{ borderLeftColor: roleAccent, borderLeftWidth: '3px' }"
  >
    <summary class="summary-row cursor-pointer list-none p-3">
      <div class="flex items-start gap-2.5">
        <div
          class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          :style="{ backgroundColor: roleAccent }"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <ChevronRight class="h-4 w-4 transition-transform group-open:rotate-90" />
            <span class="text-ppx-text"
              >#{{ index ?? '-' }} {{ t(`trace.role.${message.role}`) }}</span
            >
            <span v-if="message.name" class="workspace-body text-xs font-medium normal-case"
              >({{ message.name }})</span
            >
          </div>
          <p class="preview-text text-ppx-text-muted mt-1 truncate text-xs">
            {{ previewText }}
          </p>
        </div>
      </div>
    </summary>

    <div class="border-ppx-border space-y-3 border-t px-3 pt-2 pb-3">
      <details v-if="hasReasoning" class="workspace-subpanel overflow-hidden p-0">
        <summary class="text-ppx-text-soft cursor-pointer px-2.5 py-2 text-xs font-semibold">
          {{ t('trace.reasoning') }}
        </summary>
        <div class="px-2.5 pb-2.5">
          <MarkdownContent :markdown="message.reasoning_content as string" />
        </div>
      </details>

      <div v-if="parsedParts.length === 0" class="workspace-body text-ppx-text-muted text-xs">
        {{ t('trace.emptyContent') }}
      </div>

      <div class="space-y-3">
        <template v-for="(part, index2) in parsedParts" :key="index2">
          <div v-if="part.type === 'text'" class="workspace-subpanel px-3 py-2.5">
            <MarkdownContent :markdown="part.text" />
          </div>
          <div v-else class="space-y-1.5">
            <img
              :src="part.url"
              :alt="t('trace.vlmImageAlt')"
              loading="lazy"
              class="border-ppx-border rounded-ppx-interactive max-h-80 w-auto border object-contain"
            />
            <a
              :href="part.url"
              target="_blank"
              rel="noreferrer"
              class="text-ppx-text-soft hover:text-ppx-text inline-flex items-center gap-1 text-xs underline underline-offset-2 transition-colors"
            >
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
/* 外层 message card 展开收起过渡 */
.group {
  display: grid;
  grid-template-rows: auto 0fr;
  transition: grid-template-rows 0.35s var(--ppx-ease-smooth);
}

.group[open] {
  grid-template-rows: auto 1fr;
}

.group > :not(summary) {
  overflow: hidden;
}

.group[open] .preview-text {
  display: none;
}

.summary-row {
  border-bottom: 1px solid transparent;
}

.group[open] .summary-row {
  border-bottom-color: var(--ppx-border);
}

/* reasoning 内层展开收起过渡 */
.workspace-subpanel {
  display: grid;
  grid-template-rows: auto 0fr;
  transition: grid-template-rows 0.3s var(--ppx-ease-smooth);
}

.workspace-subpanel[open] {
  grid-template-rows: auto 1fr;
}

.workspace-subpanel > :not(summary) {
  overflow: hidden;
}
</style>
