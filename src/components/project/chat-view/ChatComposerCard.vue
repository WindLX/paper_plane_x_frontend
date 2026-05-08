<script setup lang="ts">
import ChatAttachmentPanel from './ChatAttachmentPanel.vue'
import type { PaperResponse } from '@/types/api'

withDefaults(
  defineProps<{
    expanded?: boolean
    hintText?: string
    selectedPapers: Map<string, PaperResponse>
    images: string[]
    attachmentsCollapsed?: boolean
  }>(),
  {
    expanded: false,
    hintText: '',
    attachmentsCollapsed: false,
  },
)

const emit = defineEmits<{
  'update:attachmentsCollapsed': [value: boolean]
  'open-paper': [paperId: string]
  'remove-paper': [paperId: string]
  'remove-image': [index: number]
  'preview-image': [src: string]
}>()
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <ChatAttachmentPanel
      :selected-papers="selectedPapers"
      :images="images"
      :collapsed="attachmentsCollapsed"
      @update:collapsed="emit('update:attachmentsCollapsed', $event)"
      @open-paper="emit('open-paper', $event)"
      @remove-paper="emit('remove-paper', $event)"
      @remove-image="emit('remove-image', $event)"
      @preview-image="emit('preview-image', $event)"
    />

    <div
      class="border-ppx-border bg-ppx-bg-elevated shadow-ppx-border/50 duration-ppx-fast text-ppx-text-soft focus-within:shadow-ppx-border/60 dark:bg-ppx-bg-inset flex gap-2 rounded-3xl border px-4 py-3 shadow-lg transition-all focus-within:shadow-xl dark:shadow-none"
      :class="expanded ? 'flex-col rounded-2xl p-5 shadow-2xl' : ''"
    >
      <div v-if="expanded" class="flex items-center justify-between">
        <span class="text-ppx-text-muted text-xs font-medium">{{ hintText }}</span>
        <slot name="header-actions" />
      </div>

      <slot />

      <div class="flex items-center justify-between gap-2">
        <div v-if="expanded" class="text-ppx-text-muted flex items-center gap-3 text-xs">
          <slot name="expanded-hint" />
        </div>
        <div v-else class="flex-1" />

        <div class="flex items-center gap-2">
          <slot name="footer-left" />
          <slot name="footer-right" />
        </div>
      </div>
    </div>
  </div>
</template>
