<script setup lang="ts">
import { ArrowUp, Expand, FileText, ImagePlus, LoaderCircle, Search, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppModalShell from '@/components/AppModalShell.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import type { PaperResponse } from '@/types/api'

const props = defineProps<{
  disabled?: boolean
  placeholder?: string
  projectId?: string
}>()

const emit = defineEmits<{
  send: []
}>()

const modelValue = defineModel<string>({ default: '' })
const images = defineModel<string[]>('images', { default: [] })
const expanded = defineModel<boolean>('expanded', { default: false })
const paperIds = defineModel<string[]>('paperIds', { default: () => [] })

const { t, te } = useI18n()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

// Paper picker state
const paperPickerOpen = ref(false)
const paperSearchKeyword = ref('')
const paperSearchLoading = ref(false)
const paperSearchResults = ref<PaperResponse[]>([])
const selectedPapers = ref<Map<string, PaperResponse>>(new Map())
const attachmentsCollapsed = ref(false)
const previewSrc = ref<string | null>(null)
const hasAttachments = computed(() => selectedPapers.value.size > 0 || images.value.length > 0)
const totalAttachments = computed(() => selectedPapers.value.size + images.value.length)

watch(
  () => paperIds.value,
  (ids) => {
    // Sync selectedPapers with paperIds when changed from outside
    for (const [id, _paper] of selectedPapers.value) {
      if (!ids.includes(id)) {
        selectedPapers.value.delete(id)
      }
    }
  },
  { immediate: true },
)

watch(
  () => hasAttachments.value,
  (has) => {
    if (has) attachmentsCollapsed.value = false
  },
)

function togglePaper(paper: PaperResponse): void {
  if (selectedPapers.value.has(paper.paper_id)) {
    selectedPapers.value.delete(paper.paper_id)
  } else {
    selectedPapers.value.set(paper.paper_id, paper)
  }
  paperIds.value = Array.from(selectedPapers.value.keys())
}

function removePaper(paperId: string): void {
  selectedPapers.value.delete(paperId)
  paperIds.value = Array.from(selectedPapers.value.keys())
}

function openPaperPicker(): void {
  if (!props.projectId) return
  paperPickerOpen.value = true
  paperSearchKeyword.value = ''
  void runPaperSearch()
}

async function runPaperSearch(): Promise<void> {
  if (!props.projectId) return
  paperSearchLoading.value = true
  try {
    const searchRes = await api.searchProject(props.projectId, {
      query_expr: paperSearchKeyword.value.trim() || undefined,
      limit: 50,
      offset: 0,
    })
    if (searchRes.paper_ids.length > 0) {
      const batchRes = await api.batchGetPapers(searchRes.paper_ids, 0, searchRes.paper_ids.length)
      paperSearchResults.value = batchRes.items
    } else {
      paperSearchResults.value = []
    }
  } catch {
    paperSearchResults.value = []
  } finally {
    paperSearchLoading.value = false
  }
}

function handlePaperSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    void runPaperSearch()
  }
}

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return '-'
  const joined = authors.join(', ')
  return joined.length > 40 ? joined.slice(0, 40) + '…' : joined
}

const hintText = computed(() => {
  if (te('chat.expandInputHint')) {
    return t('chat.expandInputHint')
  }
  return '展开编辑模式 · Esc 收起'
})

function onSend(): void {
  if (!modelValue.value.trim() || props.disabled) return
  emit('send')
  expanded.value = false
}

function removeImage(index: number): void {
  images.value = images.value.filter((_, i) => i !== index)
}

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

async function onFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  const remainingSlots = MAX_IMAGES - images.value.length
  if (remainingSlots <= 0) return

  const toProcess = Array.from(files).slice(0, remainingSlots)
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

  target.value = ''
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (!files) return
  handleFiles(Array.from(files))
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
}

async function handleFiles(files: File[]): Promise<void> {
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

function resizeTextarea(): void {
  const el = textareaRef.value
  if (!el) return
  el.style.height = '0px'
  const maxHeight = expanded.value ? 560 : 160
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

function onKeydown(event: KeyboardEvent): void {
  // Esc: collapse expanded input
  if (event.key === 'Escape' && expanded.value) {
    event.preventDefault()
    expanded.value = false
    return
  }

  if (event.key !== 'Enter') return
  if (event.isComposing) return

  // Ctrl/Cmd + Enter → send (in both modes)
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    onSend()
    return
  }

  // Enter → newline (default textarea behavior)
  // No need to prevent default; let textarea insert newline naturally
}

function toggleExpanded(): void {
  expanded.value = !expanded.value
  if (expanded.value) {
    nextTick(() => textareaRef.value?.focus())
  }
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
</script>

<template>
  <div class="relative">
    <!-- Expanded overlay backdrop -->
    <Transition name="fade">
      <div
        v-if="expanded"
        class="fixed inset-0 z-55 bg-black/40 backdrop-blur-md"
        @click="expanded = false"
      />
    </Transition>

    <!-- Content wrapper -->
    <div
      :class="[
        'flex flex-col gap-2',
        expanded ? 'fixed bottom-6 left-1/2 z-70 w-[min(95vw,72rem)] -translate-x-1/2' : '',
      ]"
    >
      <!-- Attachment panel -->
      <Transition name="fade">
        <div
          v-if="hasAttachments && !attachmentsCollapsed"
          class="workspace-panel rounded-ppx-panel max-h-[25vh] overflow-y-auto p-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-ppx-text-muted text-xs font-medium">{{ t('chat.attachments') }}</span>
            <button
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="t('chat.collapseInput')"
              @click="attachmentsCollapsed = true"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div v-if="selectedPapers.size > 0" class="flex flex-wrap gap-1.5">
            <button
              v-for="paper in selectedPapers.values()"
              :key="paper.paper_id"
              type="button"
              class="workspace-chip text-ppx-accent bg-ppx-accent-soft/40 border-ppx-accent hover:bg-ppx-accent-soft/60 flex cursor-pointer items-center gap-1 border text-xs transition-colors"
              @click="removePaper(paper.paper_id)"
            >
              <FileText class="h-3 w-3" />
              <span class="max-w-48 truncate">{{ paper.title || paper.paper_id }}</span>
              <X class="h-4 w-4" />
            </button>
          </div>
          <div v-if="images.length > 0" class="mt-2 flex flex-wrap gap-2">
            <div v-for="(img, idx) in images" :key="idx" class="group relative inline-block">
              <img
                :src="img"
                class="border-ppx-border h-16 w-16 cursor-zoom-in rounded-lg border object-cover"
                alt=""
                @click="previewSrc = img"
              />
              <button
                type="button"
                class="bg-ppx-text absolute -top-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                @click="removeImage(idx)"
              >
                <X class="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Collapsed attachment indicator -->
      <div v-if="hasAttachments && attachmentsCollapsed" class="flex justify-center">
        <button
          type="button"
          class="workspace-chip text-ppx-accent bg-ppx-accent-soft/40 border-ppx-accent hover:bg-ppx-accent-soft/60 flex cursor-pointer items-center gap-1 border text-xs transition-colors"
          @click="attachmentsCollapsed = false"
        >
          <span>{{ totalAttachments }} {{ t('chat.attachmentCount') }}</span>
        </button>
      </div>

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
            :title="t('chat.collapseInput')"
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
          :placeholder="placeholder ?? t('chat.inputPlaceholder')"
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
              <span>{{ t('chat.keyboardNewLine') }}</span>
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
              <span>{{ t('chat.keyboardSend') }}</span>
            </span>
            <span class="flex items-center gap-1">
              <kbd
                class="workspace-code border-ppx-border bg-ppx-bg-subtle rounded border px-1 py-0.5 text-[10px]"
                >Esc</kbd
              >
              <span>{{ t('chat.keyboardCollapse') }}</span>
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
              v-if="props.projectId"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="t('chat.attachPaper')"
              @click="openPaperPicker"
            >
              <FileText class="h-4 w-4" />
            </button>
            <button
              v-if="images.length < MAX_IMAGES"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="t('chat.attachImage')"
              @click="openFilePicker"
            >
              <ImagePlus class="h-4 w-4" />
            </button>
            <button
              v-if="!expanded"
              type="button"
              class="workspace-icon-button h-8 w-8 shrink-0"
              :title="t('chat.expandInput')"
              @click="toggleExpanded"
            >
              <Expand class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="duration-ppx-fast flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all"
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
  <AppModalShell
    :open="paperPickerOpen"
    :title="t('chat.attachPaper')"
    width-class="max-w-3xl"
    @close="paperPickerOpen = false"
  >
    <div class="space-y-3">
      <!-- Search box -->
      <label class="workspace-panel flex items-center gap-2 px-3 py-2.5">
        <Search class="workspace-muted h-4 w-4" />
        <input
          v-model="paperSearchKeyword"
          :placeholder="t('projectDetail.paperSearchPlaceholder')"
          class="text-ppx-text w-full bg-transparent text-sm outline-none"
          @keydown="handlePaperSearchKeydown"
        />
        <button v-if="paperSearchLoading" type="button" class="workspace-icon-button h-6 w-6">
          <LoaderCircle class="h-4 w-4 animate-spin" />
        </button>
      </label>

      <!-- Results -->
      <div v-if="paperSearchResults.length > 0" class="max-h-[60vh] space-y-1 overflow-y-auto">
        <button
          v-for="paper in paperSearchResults"
          :key="paper.paper_id"
          type="button"
          class="duration-ppx-fast flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          :class="
            selectedPapers.has(paper.paper_id)
              ? 'bg-ppx-accent-soft/40 text-ppx-accent border-ppx-accent border'
              : 'text-ppx-text hover:bg-ppx-bg-subtle border border-transparent'
          "
          @click="togglePaper(paper)"
        >
          <FileText
            class="mt-0.5 h-4 w-4 shrink-0"
            :class="selectedPapers.has(paper.paper_id) ? 'text-ppx-accent' : 'text-ppx-text-muted'"
          />
          <div class="min-w-0 flex-1 space-y-0.5">
            <div class="truncate font-medium">{{ paper.title || paper.paper_id }}</div>
            <div class="text-ppx-text-muted text-xs">
              <span class="truncate">{{ formatAuthors(paper.authors) }}</span>
              <span v-if="paper.publication"> · {{ paper.publication }}</span>
              <span v-if="paper.year"> · {{ paper.year }}</span>
            </div>
            <div class="text-ppx-text-muted text-xs">
              {{ paper.paper_id }} · {{ paper.created_at.slice(0, 10) }}
            </div>
          </div>
        </button>
      </div>

      <div v-else-if="!paperSearchLoading" class="workspace-body px-3 py-6 text-center text-sm">
        {{ t('projectDetail.searchResultEmpty') }}
      </div>
    </div>
  </AppModalShell>

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
