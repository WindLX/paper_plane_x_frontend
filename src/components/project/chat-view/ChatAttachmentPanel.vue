<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PaperResponse } from '@/types/api'

const props = defineProps<{
  selectedPapers: Map<string, PaperResponse>
  images: string[]
  collapsed?: boolean
}>()

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  'open-paper': [paperId: string]
  'remove-paper': [paperId: string]
  'remove-image': [index: number]
  'preview-image': [src: string]
}>()

const { t } = useI18n()

const hasAttachments = computed(() => props.selectedPapers.size > 0 || props.images.length > 0)

watch(
  () => hasAttachments.value,
  (has) => {
    if (has) emit('update:collapsed', false)
  },
)

function onOpenPaper(paperId: string): void {
  emit('open-paper', paperId)
}

function onRemovePaper(paperId: string): void {
  emit('remove-paper', paperId)
}

function onRemoveImage(index: number): void {
  emit('remove-image', index)
}

function onPreviewImage(src: string): void {
  emit('preview-image', src)
}
</script>

<template>
  <div>
    <!-- Expanded attachment panel -->
    <Transition name="fade">
      <div
        v-if="hasAttachments && !collapsed"
        class="workspace-panel rounded-ppx-panel max-h-[18vh] overflow-y-auto px-3 py-2"
      >
        <div class="mb-2 flex items-center">
          <span class="text-ppx-text-muted text-xs font-medium">{{ t('projects.chatView.attachments') }}</span>
        </div>
        <div v-if="selectedPapers.size > 0" class="flex flex-wrap gap-1.5">
          <div
            v-for="paper in selectedPapers.values()"
            :key="paper.paper_id"
            class="workspace-chip text-ppx-accent bg-ppx-accent-soft/40 border-ppx-accent hover:bg-ppx-accent-soft/60 group flex cursor-pointer items-center gap-1 border text-xs transition-colors"
            @click="onOpenPaper(paper.paper_id)"
          >
            <FileText class="h-3 w-3" />
            <span class="max-w-48 truncate">{{ paper.title || paper.paper_id }}</span>
            <button
              type="button"
              class="text-ppx-text-muted hover:text-ppx-text ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded opacity-60 transition-opacity hover:opacity-100"
              @click.stop="onRemovePaper(paper.paper_id)"
            >
              <X class="h-3 w-3" />
            </button>
          </div>
        </div>
        <div v-if="images.length > 0" class="mt-2 flex flex-wrap gap-2">
          <div v-for="(img, idx) in images" :key="idx" class="group relative inline-block">
            <img
              :src="img"
              class="border-ppx-border h-16 w-16 cursor-zoom-in rounded-lg border object-cover"
              alt=""
              @click="onPreviewImage(img)"
            />
            <button
              type="button"
              class="bg-ppx-text hover:bg-ppx-text-muted absolute -top-1.5 -right-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              @click="onRemoveImage(idx)"
            >
              <X class="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms var(--ppx-ease);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
