<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MarkdownContent from '../MarkdownContent.vue'
import JsonPanel from '../JsonPanel.vue'
import type { TraceMessage } from '@/types/api'

const props = defineProps<{
  message: TraceMessage
}>()

const { t } = useI18n()

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

const roleAccentColor = computed(() => {
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
</script>

<template>
  <div class="animate-fade-in-up space-y-2.5 px-3 pt-2 pb-3">
    <details
      v-if="hasReasoning"
      class="workspace-subpanel overflow-hidden"
      :style="{ borderLeftColor: roleAccentColor, borderLeftWidth: '3px' }"
    >
      <summary
        class="text-ppx-text-soft flex cursor-pointer items-center gap-1.5 px-2.5 py-2 text-xs font-semibold"
      >
        <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: roleAccentColor }" />
        {{ t('traces.reasoning') }}
      </summary>
      <div class="px-2.5 pb-2.5">
        <MarkdownContent :markdown="message.reasoning_content as string" :enable-math="false" />
      </div>
    </details>

    <div v-if="parsedParts.length === 0" class="workspace-body text-ppx-text-muted text-xs">
      {{ t('traces.emptyContent') }}
    </div>

    <div class="space-y-2.5">
      <template v-for="(part, index2) in parsedParts" :key="index2">
        <div v-if="part.type === 'text'" class="workspace-subpanel px-3 py-2.5">
          <MarkdownContent :markdown="part.text" :enable-math="false" />
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

    <div class="pt-1">
      <JsonPanel :title="t('traces.rawMessageJson')" :value="message" />
    </div>
  </div>
</template>
