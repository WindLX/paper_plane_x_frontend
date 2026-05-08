<script setup lang="ts">
import { computed, ref } from 'vue'
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
const open = ref(false)

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
  if (!open.value) {
    return []
  }
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

const firstToolCall = computed(() => {
  if (!Array.isArray(props.message.tool_calls) || props.message.tool_calls.length === 0) {
    return null
  }
  const first = props.message.tool_calls[0]
  return typeof first === 'object' && first !== null ? (first as Record<string, unknown>) : null
})

const hasToolCalls = computed(() => firstToolCall.value !== null)

const isToolResult = computed(
  () =>
    props.message.role === 'tool' ||
    Boolean(props.message.tool_call_id),
)

const toolCallTitle = computed(() => {
  const fn = firstToolCall.value?.function
  if (typeof fn === 'object' && fn !== null && typeof (fn as Record<string, unknown>).name === 'string') {
    return (fn as Record<string, string>).name
  }
  return props.message.name || t('traces.role.tool')
})

const previewText = computed(() => {
  if (hasToolCalls.value) {
    return toolCallTitle.value
  }
  if (isToolResult.value && typeof props.message.name === 'string' && props.message.name.length > 0) {
    return props.message.name
  }
  const content = props.message.content
  if (typeof content === 'string') {
    const text = content.replace(/\s+/g, ' ').trim()
    if (!text) return t('traces.emptyContent')
    if (text.length <= 40) return text
    return `${text.slice(0, 40)}...`
  }

  if (!Array.isArray(content)) {
    return t('traces.emptyContent')
  }

  for (const item of content) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const part = item as Record<string, unknown>
    if (part.type === 'text' && typeof part.text === 'string') {
      const text = part.text.replace(/\s+/g, ' ').trim()
      if (!text) {
        continue
      }
      if (text.length <= 40) return text
      return `${text.slice(0, 40)}...`
    }
  }

  if (content.length > 0) {
    return t('traces.multimodalMessage')
  }

  return t('traces.emptyContent')
})

function handleToggle(event: Event): void {
  open.value = (event.currentTarget as HTMLDetailsElement).open
}

const hasVisibleParts = computed(() => {
  if (typeof props.message.content === 'string') {
    return props.message.content.length > 0
  }
  return parsedParts.value.length > 0
})

const showEmptyState = computed(() => {
  if (!open.value) {
    return false
  }
  if (hasReasoning.value || hasToolCalls.value || isToolResult.value) {
    return false
  }
  if (typeof props.message.content === 'string') {
    return props.message.content.length === 0
  }
  return parsedParts.value.length === 0
})
</script>

<template>
  <details
    class="group workspace-panel animate-fade-in-up overflow-hidden p-0"
    :class="roleAlignClass"
    :style="{ borderLeftColor: roleAccent, borderLeftWidth: '3px' }"
    @toggle="handleToggle"
  >
    <summary class="summary-row cursor-pointer list-none p-3">
      <div class="flex items-start gap-2.5">
        <div
          class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          :style="{ backgroundColor: roleAccent }"
        />
        <div class="min-w-0 flex-1 overflow-hidden">
          <div class="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <ChevronRight class="h-4 w-4 transition-transform group-open:rotate-90" />
            <span class="text-ppx-text"
              >#{{ index ?? '-' }} {{ t(`traces.role.${message.role}`) }}</span
            >
            <span v-if="message.name" class="workspace-body text-xs font-medium normal-case"
              >({{ message.name }})</span
            >
          </div>
          <p class="preview-text text-ppx-text-muted m-1 max-w-full truncate text-xs">
            {{ previewText }}
          </p>
        </div>
      </div>
    </summary>

    <div v-if="open" class="border-ppx-border space-y-3 border-t px-3 pt-2 pb-3">
      <details v-if="hasReasoning" class="workspace-subpanel overflow-hidden p-0">
        <summary class="text-ppx-text-soft cursor-pointer px-2.5 py-2 text-xs font-semibold">
          {{ t('traces.reasoning') }}
        </summary>
        <div class="px-2.5 pb-2.5">
          <MarkdownContent :markdown="message.reasoning_content as string" />
        </div>
      </details>

      <JsonPanel
        v-if="hasToolCalls"
        :title="toolCallTitle"
        :value="firstToolCall ?? message.tool_calls"
      />

      <JsonPanel
        v-else-if="isToolResult && (message.tool_call_id || message.content)"
        :title="message.name || t('traces.role.tool')"
        :value="{
          tool_call_id: message.tool_call_id,
          name: message.name,
          content: message.content,
        }"
      />

      <div v-if="showEmptyState" class="workspace-body text-ppx-text-muted text-xs">
        {{ t('traces.emptyContent') }}
      </div>

      <div v-else-if="hasVisibleParts && !hasToolCalls && !isToolResult" class="space-y-3">
        <template v-for="(part, index2) in parsedParts" :key="index2">
          <div v-if="part.type === 'text'" class="workspace-subpanel px-3 py-2.5">
            <MarkdownContent :markdown="part.text" />
          </div>
          <div v-else class="space-y-1.5">
            <img
              :src="part.url"
              :alt="t('traces.vlmImageAlt')"
              loading="lazy"
              class="border-ppx-border rounded-ppx-interactive max-h-80 w-auto border object-contain"
            />
            <a
              :href="part.url"
              target="_blank"
              rel="noreferrer"
              class="text-ppx-text-soft hover:text-ppx-text inline-flex items-center gap-1 text-xs underline underline-offset-2 transition-colors"
            >
              {{ t('traces.openImage') }}
            </a>
          </div>
        </template>
      </div>

      <JsonPanel :title="t('traces.rawMessageJson')" :value="message" />
    </div>
  </details>
</template>

<style scoped>
/* 外层 message card 展开收起过渡 */
.group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
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
  overflow: hidden;
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
