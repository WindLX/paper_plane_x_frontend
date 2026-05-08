<script setup lang="ts">
import type { PaperResponse } from '@/types/api'

import ChatComposerCard from './ChatComposerCard.vue'
import ChatComposerOverlay from './ChatComposerOverlay.vue'

withDefaults(
  defineProps<{
    open: boolean
    expanded?: boolean
    widthClass?: string
    bottomClass?: string
    showBackdrop?: boolean
    hintText?: string
    selectedPapers: Map<string, PaperResponse>
    images: string[]
    attachmentsCollapsed?: boolean
    compactCollapsed?: boolean
  }>(),
  {
    expanded: false,
    widthClass: 'max-w-5xl',
    bottomClass: 'pb-6',
    showBackdrop: true,
    hintText: '',
    attachmentsCollapsed: false,
    compactCollapsed: false,
  },
)

const emit = defineEmits<{
  close: []
  'update:attachmentsCollapsed': [value: boolean]
  'open-paper': [paperId: string]
  'remove-paper': [paperId: string]
  'remove-image': [index: number]
  'preview-image': [src: string]
}>()
</script>

<template>
  <ChatComposerOverlay
    :open="open"
    :width-class="widthClass"
    :bottom-class="bottomClass"
    :show-backdrop="showBackdrop"
    @close="emit('close')"
  >
    <ChatComposerCard
      :expanded="expanded"
      :hint-text="hintText"
      :selected-papers="selectedPapers"
      :images="images"
      :attachments-collapsed="attachmentsCollapsed"
      :compact-collapsed="compactCollapsed"
      @update:attachments-collapsed="emit('update:attachmentsCollapsed', $event)"
      @open-paper="emit('open-paper', $event)"
      @remove-paper="emit('remove-paper', $event)"
      @remove-image="emit('remove-image', $event)"
      @preview-image="emit('preview-image', $event)"
    >
      <template #header-actions>
        <slot name="header-actions" />
      </template>
      <slot />
      <template #expanded-hint>
        <slot name="expanded-hint" />
      </template>
      <template #footer-left>
        <slot name="footer-left" />
      </template>
      <template #footer-right>
        <slot name="footer-right" />
      </template>
    </ChatComposerCard>
  </ChatComposerOverlay>
</template>
