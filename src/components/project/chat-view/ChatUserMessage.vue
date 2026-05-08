<script setup lang="ts">
import { Check, ChevronDown, ChevronUp, Expand, FileText, ImagePlus, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ChatTurnActions from './ChatTurnActions.vue'
import ChatComposerPanel from './ChatComposerPanel.vue'
import ChatPaperPicker from './ChatPaperPicker.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { api } from '@/api'
import type { ConversationMessageResponse, PaperResponse } from '@/types/api'

const props = defineProps<{
  msg: ConversationMessageResponse
  hovered: boolean
  editing: boolean
  projectId?: string
  forkLoading?: boolean
}>()

const editContent = defineModel<string>('editContent', { default: '' })
const editImages = defineModel<string[]>('editImages', { default: () => [] })
const editPaperIds = defineModel<string[]>('editPaperIds', { default: () => [] })

const papersData = ref<Map<string, PaperResponse>>(new Map())
const editingPapers = ref<Map<string, PaperResponse>>(new Map())
const previewSrc = ref<string | null>(null)
const editExpanded = ref(false)
const editAttachmentsCollapsed = ref(false)
const paperPickerOpen = ref(false)
const localHovered = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const { t } = useI18n()

async function loadPapersForIds(
  ids: string[] | null | undefined,
  target: typeof papersData,
): Promise<void> {
  const nextIds = ids?.filter(Boolean)
  if (!nextIds || nextIds.length === 0) {
    target.value = new Map()
    return
  }
  try {
    const res = await api.batchGetPapers(nextIds, 0, nextIds.length)
    const map = new Map<string, PaperResponse>()
    for (const p of res.items) {
      map.set(p.paper_id, p)
    }
    target.value = map
  } catch {
    target.value = new Map()
  }
}

async function loadPapers(): Promise<void> {
  const ids = props.msg.paper_ids?.filter(Boolean)
  if (!ids || ids.length === 0) {
    papersData.value = new Map()
    return
  }
  await loadPapersForIds(ids, papersData)
}

onMounted(loadPapers)
watch(() => props.msg.paper_ids, loadPapers, { immediate: true })
watch(
  () => editPaperIds.value,
  (ids) => {
    void loadPapersForIds(ids, editingPapers)
  },
  { immediate: true },
)

const emit = defineEmits<{
  edit: []
  rerun: []
  delete: []
  fork: []
  confirmEdit: []
  cancelEdit: []
  openPaper: [paperId: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function removeEditImage(idx: number): void {
  editImages.value = editImages.value.filter((_, i) => i !== idx)
}

function removeEditPaper(paperId: string): void {
  editingPapers.value.delete(paperId)
  editPaperIds.value = editPaperIds.value.filter((id) => id !== paperId)
}

function openEditFilePicker(): void {
  if (editImages.value.length >= MAX_IMAGES) return
  fileInputRef.value?.click()
}

function openEditPaperPicker(): void {
  if (!props.projectId) return
  paperPickerOpen.value = true
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onEditFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  const remaining = MAX_IMAGES - editImages.value.length
  if (remaining <= 0) return

  const toProcess = Array.from(files).slice(0, remaining)
  const results: string[] = []

  for (const file of toProcess) {
    if (file.size > MAX_IMAGE_SIZE) continue
    if (!file.type.startsWith('image/')) continue
    try {
      const dataUrl = await readFileAsDataURL(file)
      results.push(dataUrl)
    } catch {
      // ignore
    }
  }

  if (results.length > 0) {
    editImages.value = [...editImages.value, ...results]
  }
  target.value = ''
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onTogglePaper(paper: PaperResponse): void {
  if (editingPapers.value.has(paper.paper_id)) {
    editingPapers.value.delete(paper.paper_id)
  } else {
    editingPapers.value.set(paper.paper_id, paper)
  }
  editPaperIds.value = Array.from(editingPapers.value.keys())
}

const attachmentCount = computed(() => editingPapers.value.size + editImages.value.length)
const editHintText = computed(() => t('projects.chatView.expandInputHint'))

function resizeTextarea(): void {
  const el = textareaRef.value
  if (!el) return
  el.style.height = '0px'
  const maxHeight = editExpanded.value ? 560 : 160
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

watch(
  editContent,
  () => {
    nextTick(() => resizeTextarea())
  },
  { immediate: true },
)

watch(
  () => props.editing,
  (editing) => {
    if (!editing) {
      editExpanded.value = false
      editAttachmentsCollapsed.value = false
      return
    }
    nextTick(() => resizeTextarea())
  },
)

watch(editExpanded, () => {
  nextTick(() => resizeTextarea())
})
</script>

<template>
  <div
    class="animate-slide-in-right group flex w-full justify-end px-4 py-3"
    @mouseenter="localHovered = true"
    @mouseleave="localHovered = false"
  >
    <div class="w-full max-w-[85%] sm:max-w-[75%] lg:max-w-[60%]">
      <ChatComposerPanel
        v-if="props.editing"
        :open="editExpanded"
        :expanded="editExpanded"
        width-class="max-w-[72rem]"
        :show-backdrop="editExpanded"
        :hint-text="editHintText"
        :selected-papers="editingPapers"
        :images="editImages"
        :attachments-collapsed="editAttachmentsCollapsed"
        @close="editExpanded = false"
        @update:attachments-collapsed="editAttachmentsCollapsed = $event"
        @open-paper="emit('openPaper', $event)"
        @remove-paper="removeEditPaper"
        @remove-image="removeEditImage"
        @preview-image="previewSrc = $event"
      >
          <template #header-actions>
            <button
              type="button"
              class="workspace-icon-button h-7 w-7"
              :title="t('projects.chatView.collapseInput')"
              @click="editExpanded = false"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </template>

          <textarea
            ref="textareaRef"
            v-model="editContent"
            rows="2"
            class="text-ppx-text min-h-6 w-full resize-none border-0 bg-transparent px-0 py-1 text-base leading-relaxed outline-none"
            :class="editExpanded ? 'min-h-64 max-h-144' : 'min-h-0'"
            @keydown.esc="emit('cancelEdit')"
            @keydown.meta.enter.prevent="emit('confirmEdit')"
            @keydown.ctrl.enter.prevent="emit('confirmEdit')"
          />

          <template #expanded-hint>
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
          </template>

          <template #footer-left>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onEditFileSelected"
            />
            <button
              v-if="attachmentCount > 0"
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="t('projects.chatView.attachments')"
              @click="editAttachmentsCollapsed = !editAttachmentsCollapsed"
            >
              <ChevronUp v-if="!editAttachmentsCollapsed" class="h-4 w-4" />
              <ChevronDown v-else class="h-4 w-4" />
            </button>
            <button
              v-if="props.projectId"
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="t('projects.chatView.attachPaper')"
              @click="openEditPaperPicker"
            >
              <FileText class="h-4 w-4" />
            </button>
            <button
              v-if="editImages.length < MAX_IMAGES"
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="t('projects.chatView.attachImage')"
              @click="openEditFilePicker"
            >
              <ImagePlus class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="
                editExpanded
                  ? t('projects.chatView.collapseInput')
                  : t('projects.chatView.expandInput')
              "
              @click="editExpanded = !editExpanded"
            >
              <Expand class="h-4 w-4" />
            </button>
          </template>

          <template #footer-right>
            <button
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="t('projects.chatView.keyboardCollapse')"
              @click="emit('cancelEdit')"
            >
              <X class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="workspace-icon-button h-8 w-8"
              :title="t('projects.chatView.keyboardSend')"
              @click="emit('confirmEdit')"
            >
              <Check class="h-4 w-4" />
            </button>
          </template>
      </ChatComposerPanel>

      <template v-else>
        <div class="space-y-2">
          <!-- Paper references -->
          <div v-if="papersData.size > 0" class="flex flex-wrap justify-end gap-2">
            <button
              v-for="paper in papersData.values()"
              :key="paper.paper_id"
              type="button"
              class="bg-ppx-accent-soft/40 text-ppx-accent hover:bg-ppx-accent/10 flex max-w-[16rem] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
              @click="emit('openPaper', paper.paper_id)"
            >
              <FileText class="h-3.5 w-3.5 shrink-0" />
              <span class="truncate">{{ paper.title || paper.paper_id }}</span>
            </button>
          </div>

          <!-- Message images -->
          <div
            v-if="props.msg.images && props.msg.images.length > 0"
            class="flex flex-wrap justify-end gap-2"
          >
            <img
              v-for="(img, idx) in msg.images"
              :key="idx"
              :src="img"
              class="border-ppx-border max-h-48 max-w-full cursor-zoom-in rounded-lg border object-cover"
              alt=""
              @click="previewSrc = img"
            />
          </div>
          <div
            class="workspace-subpanel text-ppx-text rounded-ppx-panel shadow-ppx-rest px-5 py-3 text-base leading-relaxed"
          >
            {{ props.msg.content ?? '' }}
          </div>
        </div>
        <div class="mt-1 flex items-center justify-end gap-2">
          <ChatTurnActions
            :visible="localHovered || props.hovered"
            align="end"
            :fork-loading="props.forkLoading"
            @edit="emit('edit')"
            @rerun="emit('rerun')"
            @delete="emit('delete')"
            @fork="emit('fork')"
          />
          <span class="text-ppx-text-muted text-xs">{{ formatTime(props.msg.created_at) }}</span>
        </div>
      </template>
    </div>

    <!-- Image Preview -->
    <Teleport to="body">
      <ImagePreview v-if="previewSrc" :src="previewSrc" @close="previewSrc = null" />
    </Teleport>

    <ChatPaperPicker
      v-model:open="paperPickerOpen"
      :project-id="props.projectId"
      :selected-paper-ids="editPaperIds"
      @toggle-paper="onTogglePaper"
    />
  </div>
</template>
