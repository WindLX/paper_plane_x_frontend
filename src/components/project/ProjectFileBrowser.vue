<script setup lang="ts">
import { Download, FileText, FolderOpen, Pencil, Plus, Save, Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import { useNotify } from '@/composables/useNotify'
import { api } from '@/api'
import type { ProjectFileItem } from '@/types/api'

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const notify = useNotify()

const currentDir = ref('/')
const items = ref<ProjectFileItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const selectedFile = ref<{
  filePath: string
  content: string
  isMarkdown: boolean
} | null>(null)
const editMode = ref(false)
const editContent = ref('')
const editFilePath = ref('')
const createMode = ref(false)
const newFileName = ref('')
const newFileContent = ref('')
const exportLoading = ref(false)
const exportMenuOpen = ref(false)

type ExportFormat = 'markdown' | 'docx' | 'pdf' | 'html'

const exportFormats: { key: ExportFormat; label: string }[] = [
  { key: 'markdown', label: 'Markdown' },
  { key: 'docx', label: 'Word' },
  { key: 'pdf', label: 'PDF' },
  { key: 'html', label: 'HTML' },
]

const breadcrumbs = computed(() => {
  const parts = currentDir.value.split('/').filter(Boolean)
  const crumbs = [{ label: 'Root', path: '/' }]
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    crumbs.push({ label: part, path })
  }
  return crumbs
})

const isMarkdownFile = (name: string): boolean => name.toLowerCase().endsWith('.md')

async function loadFiles(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await api.listProjectFiles(props.projectId, currentDir.value)
    items.value = res.items
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

function navigateToDir(path: string): void {
  selectedFile.value = null
  editMode.value = false
  createMode.value = false
  currentDir.value = path
  void loadFiles()
}

async function openFile(item: ProjectFileItem): Promise<void> {
  const filePath = `${currentDir.value === '/' ? '' : currentDir.value}/${item.name}`
  loading.value = true
  try {
    const res = await api.readProjectFile(props.projectId, filePath)
    selectedFile.value = {
      filePath: res.file_path,
      content: res.content,
      isMarkdown: isMarkdownFile(item.name),
    }
    editContent.value = res.content
    editFilePath.value = res.file_path
    editMode.value = false
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  } finally {
    loading.value = false
  }
}

function enterDir(item: ProjectFileItem): void {
  const nextDir = `${currentDir.value === '/' ? '' : currentDir.value}/${item.name}`
  navigateToDir(nextDir)
}

function startCreate(): void {
  createMode.value = true
  newFileName.value = ''
  newFileContent.value = ''
  editMode.value = false
  selectedFile.value = null
}

function cancelCreate(): void {
  createMode.value = false
}

async function confirmCreate(): Promise<void> {
  const name = newFileName.value.trim()
  if (!name) return
  const filePath = `${currentDir.value === '/' ? '' : currentDir.value}/${name}`
  try {
    await api.writeProjectFile(props.projectId, {
      file_path: filePath,
      content: newFileContent.value,
    })
    notify.push(t('projectDetail.fileCreated', { name }), 'success', 2000)
    createMode.value = false
    await loadFiles()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

function startEdit(): void {
  if (!selectedFile.value) return
  editMode.value = true
  editContent.value = selectedFile.value.content
}

function cancelEdit(): void {
  editMode.value = false
  if (selectedFile.value) {
    editContent.value = selectedFile.value.content
  }
}

async function confirmEdit(): Promise<void> {
  if (!editFilePath.value) return
  try {
    await api.writeProjectFile(props.projectId, {
      file_path: editFilePath.value,
      content: editContent.value,
    })
    notify.push(t('projectDetail.fileUpdated'), 'success', 2000)
    if (selectedFile.value) {
      selectedFile.value.content = editContent.value
    }
    editMode.value = false
    await loadFiles()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function deleteFile(item: ProjectFileItem): Promise<void> {
  const filePath = `${currentDir.value === '/' ? '' : currentDir.value}/${item.name}`
  if (!confirm(t('projectDetail.confirmDeleteFile', { name: item.name }))) return
  try {
    await api.deleteProjectFile(props.projectId, filePath)
    notify.push(t('projectDetail.fileDeleted', { name: item.name }), 'success', 2000)
    if (selectedFile.value?.filePath === filePath) {
      selectedFile.value = null
      editMode.value = false
    }
    await loadFiles()
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function exportFile(format: ExportFormat): Promise<void> {
  if (!selectedFile.value) return
  exportLoading.value = true
  try {
    const blob = await api.exportProjectFile(props.projectId, {
      file_path: selectedFile.value.filePath,
      format,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ext = format === 'markdown' ? 'md' : format
    a.download = `${selectedFile.value.filePath.split('/').pop()?.replace(/\.md$/, '') ?? 'export'}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    notify.push(t('projectDetail.fileExported', { format: format.toUpperCase() }), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  } finally {
    exportLoading.value = false
  }
}

watch(() => props.projectId, loadFiles, { immediate: true })
</script>

<template>
  <section class="animate-fade-in-up space-y-3">
    <!-- Breadcrumb -->
    <div class="workspace-panel flex flex-wrap items-center gap-1 p-2">
      <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.path">
        <button
          type="button"
          class="text-ppx-text-soft hover:text-ppx-text cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors"
          :class="idx === breadcrumbs.length - 1 ? 'text-ppx-text font-semibold' : ''"
          @click="navigateToDir(crumb.path)"
        >
          {{ crumb.label }}
        </button>
        <span v-if="idx < breadcrumbs.length - 1" class="text-ppx-text-muted text-xs">/</span>
      </template>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-2">
      <h3 class="workspace-section-title text-sm">{{ t('projectDetail.projectFiles') }}</h3>
      <div class="flex items-center gap-1.5">
        <AppButton size="xs" variant="outline" @click="startCreate">
          <Plus class="h-4 w-4" />
          <span>{{ t('actions.create') }}</span>
        </AppButton>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs">
      {{ error }}
    </div>

    <!-- Create file form -->
    <div v-if="createMode" class="workspace-panel space-y-3 p-3.5">
      <div class="flex items-center justify-between">
        <h4 class="workspace-section-title text-sm">{{ t('projectDetail.createFile') }}</h4>
        <button type="button" class="workspace-icon-button h-7 w-7" @click="cancelCreate">
          <X class="h-4 w-4" />
        </button>
      </div>
      <div>
        <label class="workspace-label mb-1">{{ t('projectDetail.fileName') }}</label>
        <input
          v-model="newFileName"
          type="text"
          class="workspace-input w-full"
          :placeholder="t('projectDetail.fileNamePlaceholder')"
        />
      </div>
      <div>
        <label class="workspace-label mb-1">{{ t('projectDetail.fileContent') }}</label>
        <textarea
          v-model="newFileContent"
          rows="8"
          class="workspace-textarea w-full"
          :placeholder="t('projectDetail.fileContentPlaceholder')"
        />
      </div>
      <div class="flex justify-end gap-2">
        <AppButton size="sm" variant="outline" @click="cancelCreate">{{
          t('actions.cancel')
        }}</AppButton>
        <AppButton size="sm" variant="solid" @click="confirmCreate">{{
          t('actions.save')
        }}</AppButton>
      </div>
    </div>

    <!-- File list -->
    <div v-if="!selectedFile && !createMode" class="workspace-panel overflow-hidden p-0">
      <div v-if="loading && items.length === 0" class="flex items-center justify-center p-6">
        <div class="text-ppx-text-muted text-sm">{{ t('common.loading') }}</div>
      </div>
      <div v-else-if="items.length === 0" class="workspace-body p-4 text-sm">
        {{ t('projectDetail.noFiles') }}
      </div>
      <div v-else class="divide-ppx-border divide-y">
        <div
          v-for="item in items"
          :key="item.name"
          class="group flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 transition-colors"
          :class="item.is_dir ? 'hover:bg-ppx-bg-subtle/60 cursor-pointer' : ''"
          @click="item.is_dir ? enterDir(item) : openFile(item)"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <FolderOpen v-if="item.is_dir" class="text-ppx-accent h-4 w-4 shrink-0" />
            <FileText v-else class="text-ppx-text-muted h-4 w-4 shrink-0" />
            <span class="text-ppx-text min-w-0 truncate text-sm font-medium">{{ item.name }}</span>
            <span v-if="!item.is_dir && item.size !== null" class="text-ppx-text-muted text-xs">
              {{ (item.size / 1024).toFixed(1) }} KB
            </span>
          </div>
          <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              v-if="!item.is_dir"
              type="button"
              class="workspace-icon-button h-8 w-8 cursor-pointer"
              :title="t('actions.delete')"
              @click.stop="deleteFile(item)"
            >
              <Trash2
                class="text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-ppx-danger-soft focus-visible:ring-3"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- File viewer / editor -->
    <div v-if="selectedFile" class="workspace-panel space-y-3 p-3.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <FileText class="text-ppx-text-muted h-4 w-4 shrink-0" />
          <span class="text-ppx-text min-w-0 truncate text-sm font-semibold">{{
            selectedFile.filePath
          }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <template v-if="!editMode">
            <AppButton size="xs" variant="outline" @click="startEdit">
              <Pencil class="h-4 w-4" />
              <span>{{ t('projectDetail.edit') }}</span>
            </AppButton>
            <template v-if="selectedFile.isMarkdown">
              <div class="relative">
                <AppButton
                  size="xs"
                  variant="outline"
                  :loading="exportLoading"
                  @click="exportMenuOpen = !exportMenuOpen"
                >
                  <Download class="h-4 w-4" />
                  <span>{{ t('projectDetail.exportFile') }}</span>
                </AppButton>
                <Transition name="select-dropdown">
                  <div
                    v-if="exportMenuOpen"
                    class="border-ppx-border bg-ppx-bg-elevated absolute right-0 z-10 mt-1 min-w-32 overflow-hidden rounded-lg border py-1 shadow-lg"
                  >
                    <button
                      v-for="fmt in exportFormats"
                      :key="fmt.key"
                      type="button"
                      class="text-ppx-text hover:bg-ppx-bg-subtle block w-full px-3 py-1.5 text-left text-xs transition-colors"
                      @click="(exportFile(fmt.key), (exportMenuOpen = false))"
                    >
                      {{ fmt.label }}
                    </button>
                  </div>
                </Transition>
              </div>
            </template>
          </template>
          <template v-else>
            <AppButton size="xs" variant="outline" @click="cancelEdit">
              <X class="h-4 w-4" />
              <span>{{ t('actions.cancel') }}</span>
            </AppButton>
            <AppButton size="xs" variant="solid" @click="confirmEdit">
              <Save class="h-4 w-4" />
              <span>{{ t('actions.save') }}</span>
            </AppButton>
          </template>
          <button
            type="button"
            class="workspace-icon-button border-ppx-border-strong text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-ppx-danger-soft h-8 w-8 focus-visible:ring-3"
            :title="t('actions.delete')"
            @click="
              deleteFile({
                name: selectedFile.filePath.split('/').pop()!,
                is_dir: false,
                size: null,
              })
            "
          >
            <Trash2 class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="workspace-icon-button h-8 w-8"
            :title="t('actions.close')"
            @click="selectedFile = null"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- View mode -->
      <div v-if="!editMode" class="max-h-[50vh] overflow-y-auto">
        <MarkdownContent v-if="selectedFile.isMarkdown" :markdown="selectedFile.content" />
        <pre
          v-else
          class="workspace-code bg-ppx-bg-subtle/50 overflow-x-auto rounded-lg p-3 text-sm"
        ><code>{{ selectedFile.content }}</code></pre>
      </div>

      <!-- Edit mode -->
      <div v-else class="space-y-2">
        <textarea
          v-model="editContent"
          rows="12"
          class="workspace-textarea w-full font-mono text-sm"
        />
      </div>
    </div>
  </section>
</template>
