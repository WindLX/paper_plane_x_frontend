<script setup lang="ts">
import { ArrowUp, ChevronDown, ChevronUp, Expand, FileText, ImagePlus, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ImagePreview from '@/components/ImagePreview.vue'
import type { PaperResponse } from '@/types/api'

import ChatAttachmentPanel from './ChatAttachmentPanel.vue'
import ChatPaperPicker from './ChatPaperPicker.vue'

const props = defineProps<{
  disabled?: boolean
  placeholder?: string
  projectId?: string
}>()

const emit = defineEmits<{
  send: []
  openPaper: [paperId: string]
}>()

const modelValue = defineModel<string>({ default: '' })
const images = defineModel<string[]>('images', { default: [] })
const expanded = defineModel<boolean>('expanded', { default: false })
const paperIds = defineModel<string[]>('paperIds', { default: () => [] })

const { t, te } = useI18n()

// --- Core Input State ---
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// --- Attachment State ---
const selectedPapers = ref<Map<string, PaperResponse>>(new Map())
const attachmentsCollapsed = ref(false)
const previewSrc = ref<string | null>(null)
const paperPickerOpen = ref(false)

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

// Sync selectedPapers with external paperIds changes
watch(
  () => paperIds.value,
  (ids) => {
    for (const [id] of selectedPapers.value) {
      if (!ids.includes(id)) {
        selectedPapers.value.delete(id)
      }
    }
  },
  { immediate: true },
)

// --- Hint Text ---
const hintText = computed(() => {
  if (te('chat.expandInputHint')) {
    return t('projects.chatView.expandInputHint')
  }
  return '展开编辑模式 · Esc 收起'
})

// --- Send ---
function onSend(): void {
  if (!modelValue.value.trim() || props.disabled) return
  emit('send')
  expanded.value = false
}

// --- Paper Picker Delegation ---
function openPaperPicker(): void {
  if (!props.projectId) return
  paperPickerOpen.value = true
}

function onTogglePaper(paper: PaperResponse): void {
  if (selectedPapers.value.has(paper.paper_id)) {
    selectedPapers.value.delete(paper.paper_id)
  } else {
    selectedPapers.value.set(paper.paper_id, paper)
  }
  paperIds.value = Array.from(selectedPapers.value.keys())
}

function onRemovePaper(paperId: string): void {
  selectedPapers.value.delete(paperId)
  paperIds.value = Array.from(selectedPapers.value.keys())
}

function onOpenPaper(paperId: string): void {
  emit('openPaper', paperId)
}

// --- Image Upload ---
function openFilePicker(): void {
  fileInputRef.value?.click()
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function processFiles(files: File[]): Promise<void> {
  const remainingSlots = MAX_IMAGES - images.value.length
  if (remainingSlots <= 0) return

  const toProcess = files.slice(0, remainingSlots)
  const results: string[] = []

  for (const file of toProcess) {
    if (file.size > MAX_IMAGE_SIZE) continue
    if (!file.type.startsWith('image/')) continue
    try {
      const dataUrl = await readFileAsDataURL(file)
      results.push(dataUrl)
    } catch {
      // ignore failed reads
    }
  }

  if (results.length > 0) {
    images.value = [...images.value, ...results]
  }
}

async function onFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  await processFiles(Array.from(files))
  target.value = ''
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (!files) return
  void processFiles(Array.from(files))
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
}

function onRemoveImage(index: number): void {
  images.value = images.value.filter((_, i) => i !== index)
}

// --- Textarea Resize ---
function resizeTextarea(): void {
  const el = textareaRef.value
  if (!el) return
  el.style.height = '0px'
  const maxHeight = expanded.value ? 560 : 160
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

watch(
  modelValue,
  () => {
    nextTick(() => resizeTextarea())
  },
  { immediate: true },
)

watch(expanded, () => {
  nextTick(() => resizeTextarea())
})

// --- Keyboard Handling ---
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && expanded.value) {
    event.preventDefault()
    expanded.value = false
    return
  }

  if (event.key !== 'Enter') return
  if (event.isComposing) return

  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    onSend()
  }
}

// --- Expand/Collapse ---
function toggleExpanded(): void {
  expanded.value = !expanded.value
  if (expanded.value) {
    nextTick(() => textareaRef.value?.focus())
  }
}
</script>

<template>
  <div class="relative">
    <!-- Expanded overlay backdrop -->
    <Transition name="fade">
      <div
        v-if="expanded"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
        @click="expanded = false"
      />
    </Transition>

    <!-- Content wrapper -->
    <div
      :class="[
        'flex flex-col gap-2',
        expanded ? 'fixed bottom-6 left-1/2 z-50 w-[min(95vw,72rem)] -translate-x-1/2' : '',
      ]"
    >
      <!-- Attachment Panel -->
      <ChatAttachmentPanel
        :selected-papers="selectedPapers"
        :images="images"
        :collapsed="attachmentsCollapsed"
        @update:collapsed="attachmentsCollapsed = $event"
        @open-paper="onOpenPaper"
        @remove-paper="onRemovePaper"
        @remove-image="onRemoveImage"
        @preview-image="previewSrc = $event"
      />

      <!-- Input container -->
      <div
        class="border-ppx-border bg-ppx-bg-elevated shadow-ppx-border/50 duration-ppx-fast text-ppx-text-soft focus-within:shadow-ppx-border/60 dark:bg-ppx-bg-inset flex gap-2 rounded-3xl border px-4 py-3 shadow-lg transition-all focus-within:shadow-xl dark:shadow-none"
        :class="expanded ? 'flex-col rounded-2xl p-5 shadow-2xl' : ''"
      >
        <!-- Expanded header -->
        <div v-if="expanded" class="flex items-center justify-between">
          <span class="text-ppx-text-muted text-xs font-medium">{{ hintText }}</span>
          <button
            type="button"
            class="workspace-icon-button h-7 w-7"
            :title="t('projects.chatView.collapseInput')"
            @click="expanded = false"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Textarea -->
        <textarea
          ref="textareaRef"
          v-model="modelValue"
          rows="1"
          class="text-ppx-text min-h-6 flex-1 resize-none bg-transparent py-1 text-base leading-relaxed outline-none"
          :class="expanded ? 'max-h-144 min-h-64' : 'max-h-40'"
          :placeholder="placeholder ?? t('projects.chatView.inputPlaceholder')"
          @keydown="onKeydown"
          @drop="onDrop"
          @dragover="onDragOver"
        />

        <!-- Footer row -->
        <div class="flex items-center justify-between gap-2">
          <!-- Hint (expanded only) -->
          <div v-if="expanded" class="text-ppx-text-muted flex items-center gap-3 text-xs">
            <span class="flex items-center gap-1">
              <kbd
                class="workspace-code border-ppx-border bg-ppx-bg-subtle rounded border px-1 py-0.5 text-[10px]"
                >Enter</kbd
              >
              <span>{{ t('projects.chatView.keyboardNewLine') }}</span>
            </span>
            <span class="flex items-center gap-1">
              <kbd
                class="workspace-code border-ppx-border bg-ppx-bg-subtle rounded border px-1 py-0.5 text-[10px]"
                >Ctrl</kbd
              >
              <span>+</span>
              <kbd
                class="workspace-code border-ppx-border bg-ppx-bg-subtle rounded border px-1 py-0.5 text-[10px]"
                >Enter</kbd
              >
              <span>{{ t('projects.chatView.keyboardSend') }}</span>
            </span>
            <span class="flex items-center gap-1">
              <kbd
                class="workspace-code border-ppx-border bg-ppx-bg-subtle rounded border px-1 py-0.5 text-[10px]"
                >Esc</kbd
              >
              <span>{{ t('projects.chatView.keyboardCollapse') }}</span>
            </span>
          </div>
          <div v-else class="flex-1" />

          <div class="flex items-center gap-2">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onFileSelected"
            />
            <button
              v-if="selectedPapers.size + images.length > 0"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="`${selectedPapers.size + images.length} ${t('projects.chatView.attachments')}`"
              @click="attachmentsCollapsed = !attachmentsCollapsed"
            >
              <ChevronUp v-if="!attachmentsCollapsed" class="h-4 w-4" />
              <ChevronDown v-else class="h-4 w-4" />
            </button>
            <button
              v-if="props.projectId"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="t('projects.chatView.attachPaper')"
              @click="openPaperPicker"
            >
              <FileText class="h-4 w-4" />
            </button>
            <button
              v-if="images.length < MAX_IMAGES"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="t('projects.chatView.attachImage')"
              @click="openFilePicker"
            >
              <ImagePlus class="h-4 w-4" />
            </button>
            <button
              v-if="!expanded"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="t('projects.chatView.expandInput')"
              @click="toggleExpanded"
            >
              <Expand class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="duration-ppx-fast flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all"
              :class="
                modelValue.trim() && !disabled
                  ? 'bg-ppx-text text-white hover:opacity-90'
                  : 'text-ppx-text-soft'
              "
              :disabled="!modelValue.trim() || disabled"
              @click="onSend"
            >
              <ArrowUp class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Paper Picker Modal -->
  <ChatPaperPicker
    v-model:open="paperPickerOpen"
    :project-id="projectId"
    :selected-paper-ids="paperIds"
    @toggle-paper="onTogglePaper"
  />

  <!-- Image Preview -->
  <ImagePreview v-if="previewSrc" :src="previewSrc" @close="previewSrc = null" />
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
