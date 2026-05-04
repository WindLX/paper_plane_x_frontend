<script setup lang="ts">
import { Check, FileText, ImagePlus, X } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'

import ChatTurnActions from './ChatTurnActions.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { api } from '@/api'
import { useUiStore } from '@/stores/ui'
import type { ConversationMessageResponse, PaperResponse } from '@/types/api'

const props = defineProps<{
  msg: ConversationMessageResponse
  hovered: boolean
  editing: boolean
}>()

const editContent = defineModel<string>('editContent', { default: '' })
const editImages = defineModel<string[]>('editImages', { default: () => [] })

const uiStore = useUiStore()
const papersData = ref<Map<string, PaperResponse>>(new Map())
const previewSrc = ref<string | null>(null)

async function loadPapers(): Promise<void> {
  const ids = props.msg.paper_ids?.filter(Boolean)
  if (!ids || ids.length === 0) {
    papersData.value = new Map()
    return
  }
  try {
    const res = await api.batchGetPapers(ids, 0, ids.length)
    const map = new Map<string, PaperResponse>()
    for (const p of res.items) {
      map.set(p.paper_id, p)
    }
    papersData.value = map
  } catch {
    // ignore
  }
}

onMounted(loadPapers)
watch(() => props.msg.paper_ids, loadPapers, { immediate: true })

const emit = defineEmits<{
  edit: []
  rerun: []
  delete: []
  fork: []
  confirmEdit: []
  cancelEdit: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function removeEditImage(idx: number): void {
  editImages.value = editImages.value.filter((_, i) => i !== idx)
}

function openEditFilePicker(): void {
  if (editImages.value.length >= MAX_IMAGES) return
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
</script>

<template>
  <div class="animate-slide-in-right group flex justify-end px-4 py-3">
    <div class="max-w-[85%] sm:max-w-[75%] lg:max-w-[60%]">
      <template v-if="props.editing">
        <div class="workspace-panel-inset rounded-ppx-panel px-4 py-3">
          <!-- Edit images -->
          <div v-if="editImages.length > 0" class="mb-2 flex flex-wrap gap-2">
            <div v-for="(img, idx) in editImages" :key="idx" class="group relative inline-block">
              <img
                :src="img"
                class="border-ppx-border h-16 w-16 rounded-lg border object-cover"
                alt=""
              />
              <button
                type="button"
                class="bg-ppx-text absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                @click="removeEditImage(idx)"
              >
                <X class="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
          <textarea
            v-model="editContent"
            rows="2"
            class="workspace-textarea min-h-0 w-full resize-none border-0 bg-transparent px-0 py-0 text-base leading-relaxed shadow-none"
            @keydown.esc="emit('cancelEdit')"
            @keydown.meta.enter.prevent="emit('confirmEdit')"
            @keydown.ctrl.enter.prevent="emit('confirmEdit')"
          />
          <div class="mt-2 flex items-center justify-between">
            <div>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="onEditFileSelected"
              />
              <button
                v-if="editImages.length < MAX_IMAGES"
                type="button"
                class="workspace-icon-button h-8 w-8"
                @click="openEditFilePicker"
              >
                <ImagePlus class="h-4 w-4" />
              </button>
            </div>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="workspace-icon-button h-8 w-8"
                @click="emit('cancelEdit')"
              >
                <X class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="workspace-icon-button h-8 w-8"
                @click="emit('confirmEdit')"
              >
                <Check class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="space-y-2">
          <!-- Paper references -->
          <div v-if="papersData.size > 0" class="flex flex-wrap justify-end gap-2">
            <button
              v-for="paper in papersData.values()"
              :key="paper.paper_id"
              type="button"
              class="bg-ppx-accent-soft/40 text-ppx-accent hover:bg-ppx-accent/10 flex max-w-[16rem] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
              @click="uiStore.openRightDrawer('paper', { paperId: paper.paper_id })"
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
            :visible="props.hovered"
            align="end"
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
  </div>
</template>
