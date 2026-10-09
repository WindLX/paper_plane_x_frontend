<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  Download,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppSelect from '@/components/AppSelect.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import ProjectFileImage from '@/components/project/ProjectFileImage.vue'
import ProjectFileSplitLayout from '@/components/project/ProjectFileSplitLayout.vue'
import {
  useProjectFileBrowserController,
  type ProjectFileExportFormat,
  type ProjectFileTreeNode,
} from '@/composables/useProjectFileBrowserController'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useUiStore } from '@/stores/ui'
import { resolveProjectFileKind } from '@/utils/projectImage'

const props = defineProps<{ projectId: string; initialFilePath?: string | null }>()
const emit = defineEmits<{ paperClick: [paperId: string] }>()
const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()
// Desktop split view tracks the real window; narrower viewports use the toggle.
const desktop = useMediaQuery('(min-width: 1024px)')
const ctrl = useProjectFileBrowserController(toRef(props, 'projectId'))
const uploadInput = ref<HTMLInputElement | null>(null)
const showTree = ref(true)

const exportFormats: { key: ProjectFileExportFormat; label: string }[] = [
  { key: 'markdown', label: 'Markdown' },
  { key: 'docx', label: 'Word' },
  { key: 'pdf', label: 'PDF' },
  { key: 'html', label: 'HTML' },
]
const EXPORT_PHASE_KEYS = {
  preparing: 'projectFiles.exportPhasePreparing',
  converting: 'projectFiles.exportPhaseConverting',
  transferring: 'projectFiles.exportPhaseTransferring',
  completed: 'projectFiles.exportPhaseCompleted',
  failed: 'projectFiles.exportPhaseFailed',
} as const

const selectedExportFormat = computed<ProjectFileExportFormat | undefined>({
  get: () => undefined,
  set: (format) => {
    if (format) void ctrl.exportFile(format)
  },
})
// Narrow the selection union once so the template branches stay type-safe.
const textSelection = computed(() => {
  const file = ctrl.selectedFile
  return file && file.kind === 'text' ? file : null
})
const imageSelection = computed(() => {
  const file = ctrl.selectedFile
  return file && file.kind === 'image' ? file : null
})
const selectedNode = computed<ProjectFileTreeNode | null>(() => {
  const file = ctrl.selectedFile
  if (!file) return null
  return {
    name: file.name,
    path: file.filePath,
    is_dir: false,
    kind: file.kind,
    size: null,
    children: null,
    expanded: false,
    loading: false,
    error: null,
  }
})
const exportPhaseLabel = computed(() =>
  ctrl.exportPhase ? t(EXPORT_PHASE_KEYS[ctrl.exportPhase]) : '',
)
// Overview and shared links use the same project-root file_path query.
const deepLinkPath = computed<string | null>(() => {
  if (typeof props.initialFilePath === 'string' && props.initialFilePath)
    return props.initialFilePath
  const raw = route.query.file_path
  return typeof raw === 'string' && raw ? raw : null
})

function isImageNode(node: ProjectFileTreeNode): boolean {
  return resolveProjectFileKind(node) === 'image'
}
function downloadSelected(): void {
  if (selectedNode.value) void ctrl.downloadFile(selectedNode.value)
}
function deleteSelected(): void {
  if (selectedNode.value) void ctrl.deleteFile(selectedNode.value)
}
function copyMarkdownRef(): void {
  if (selectedNode.value) void ctrl.copyMarkdownRef(selectedNode.value)
}

watch(
  () => [ctrl.selectedFile, ctrl.createMode, ctrl.createDirMode],
  () => {
    if (ctrl.selectedFile || ctrl.createMode || ctrl.createDirMode) showTree.value = false
  },
)
// Honor deep links for the current project only; the controller still prompts
// before replacing an unsaved draft, so switching the query never discards it.
watch(
  deepLinkPath,
  (value) => {
    if (!value) return
    const routeProjectId = route.params.projectId
    if (typeof routeProjectId === 'string' && routeProjectId !== props.projectId) return
    void ctrl.openPath(value)
  },
  { immediate: true },
)
onBeforeRouteLeave(() => ctrl.ensureCanLeave())
onBeforeRouteUpdate(() => ctrl.ensureCanLeave())
function beforeUnload(event: BeforeUnloadEvent): void {
  if (!ctrl.dirty && !ctrl.busy) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
function handleUpload(event: Event): void {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const files = Array.from(input.files ?? [])
  input.value = ''
  void ctrl.uploadFiles(files)
}
defineExpose({ ensureCanLeave: ctrl.ensureCanLeave, openPath: ctrl.openPath })
</script>

<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <nav
        class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        :aria-label="t('projects.fileBrowser.targetDirectory')"
      >
        <template v-for="(crumb, index) in ctrl.breadcrumbs" :key="crumb.path">
          <span v-if="index" class="text-ppx-text-muted">/</span>
          <button
            type="button"
            class="text-ppx-text-soft hover:text-ppx-text max-w-full cursor-pointer truncate rounded px-1 text-sm"
            :disabled="ctrl.busy"
            :title="crumb.path"
            @click="ctrl.navigateToDir(crumb.path)"
          >
            {{ crumb.label }}
          </button>
        </template>
      </nav>
      <div class="flex flex-wrap items-center gap-1.5">
        <AppButton size="xs" variant="outline" :disabled="ctrl.busy" @click="uploadInput?.click()">
          <Upload class="h-4 w-4" />{{ t('projects.fileBrowser.upload') }}
        </AppButton>
        <AppButton size="xs" variant="outline" :disabled="ctrl.busy" @click="ctrl.startCreateDir">
          <FolderPlus class="h-4 w-4" />{{ t('projects.createDir') }}
        </AppButton>
        <AppButton size="xs" variant="outline" :disabled="ctrl.busy" @click="ctrl.startCreate">
          <Plus class="h-4 w-4" />{{ t('projects.createFile') }}
        </AppButton>
        <AppButton
          size="xs"
          variant="outline"
          :disabled="ctrl.busy || ctrl.root.loading"
          :aria-label="t('projects.fileBrowser.refresh')"
          @click="ctrl.loadFiles"
        >
          <RefreshCw class="h-4 w-4" />
        </AppButton>
      </div>
      <input
        ref="uploadInput"
        type="file"
        accept=".md,.txt,.json,.csv,.yaml,.yml,.toml,.png,.jpg,.jpeg,.webp,.gif,.svg"
        multiple
        hidden
        :aria-label="t('projects.fileBrowser.upload')"
        @change="handleUpload"
      />
    </div>

    <div
      v-if="ctrl.error"
      role="alert"
      class="workspace-badge--danger rounded-ppx-interactive max-h-28 shrink-0 overflow-auto px-3 py-2 text-sm wrap-anywhere whitespace-pre-wrap"
    >
      {{ ctrl.error }}
    </div>
    <details
      v-if="ctrl.uploadResults.length"
      class="workspace-panel max-h-36 shrink-0 overflow-auto p-2"
      open
    >
      <summary class="workspace-body cursor-pointer" aria-live="polite">
        {{ t('projects.fileBrowser.uploadResults') }} ({{ ctrl.uploadResults.length }})
      </summary>
      <ul class="space-y-1 pt-2 text-sm">
        <li v-for="(result, index) in ctrl.uploadResults" :key="index" class="wrap-anywhere">
          {{ result.name }} — {{ t('projects.fileBrowser.' + result.status)
          }}<span v-if="result.reason">: {{ result.reason }}</span>
        </li>
      </ul>
    </details>
    <slot name="export-progress" :phase="ctrl.exportPhase" :progress="ctrl.exportProgress">
      <div
        v-if="ctrl.exportPhase"
        role="status"
        class="workspace-panel shrink-0 p-2 text-xs"
        aria-live="polite"
      >
        <p class="workspace-body font-semibold">
          {{ t('projectFiles.exportTitle') }} — {{ exportPhaseLabel }}
        </p>
        <p v-if="ctrl.exportProgress" class="workspace-body">
          {{
            t('projectFiles.exportProgressDetail', {
              received: ctrl.exportProgress.received,
              total: ctrl.exportProgress.total ?? '—',
            })
          }}
        </p>
        <progress
          v-if="ctrl.exportLoading"
          class="workspace-progress"
          :value="
            ctrl.exportPhase === 'transferring' && ctrl.exportProgress?.total
              ? ctrl.exportProgress.received
              : undefined
          "
          :max="ctrl.exportProgress?.total ?? 100"
          :aria-label="exportPhaseLabel"
        />
      </div>
    </slot>
    <div class="flex gap-2 lg:hidden">
      <AppButton size="xs" :variant="showTree ? 'solid' : 'outline'" @click="showTree = true">{{
        t('projects.fileBrowser.tree')
      }}</AppButton>
      <AppButton size="xs" :variant="!showTree ? 'solid' : 'outline'" @click="showTree = false">{{
        t('projects.fileBrowser.content')
      }}</AppButton>
    </div>
    <ProjectFileSplitLayout
      :desktop="desktop"
      :show-tree="showTree"
      :tree-width="ui.fileTreeWidth"
      @commit-width="ui.setFileTreeWidth"
    >
      <template #tree>
        <aside
          class="h-full min-h-0 w-full min-w-0 overflow-auto p-2"
          :class="{ 'workspace-panel': !desktop }"
          :aria-label="t('projects.fileBrowser.tree')"
          :aria-busy="ctrl.root.loading"
        >
          <p v-if="ctrl.root.loading && !ctrl.root.children" class="workspace-body p-2">
            {{ t('projects.common.loading') }}
          </p>
          <div v-if="ctrl.root.error" role="alert" class="workspace-body p-2 wrap-anywhere">
            {{ ctrl.root.error }}
            <AppButton size="xs" @click="ctrl.loadDirectory(ctrl.root)">{{
              t('projects.fileBrowser.refresh')
            }}</AppButton>
          </div>
          <p v-else-if="ctrl.root.children?.length === 0" class="workspace-body p-2">
            {{ t('projects.noFiles') }}
          </p>
          <ul class="space-y-1">
            <li v-for="{ node, depth } in ctrl.rows" :key="node.path" class="min-w-0">
              <div
                class="flex min-w-0 items-center gap-1"
                :style="{ paddingLeft: depth * 12 + 'px' }"
              >
                <button
                  type="button"
                  class="hover:bg-ppx-bg-subtle text-ppx-text rounded-ppx-interactive flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 px-1 py-2 text-left text-sm"
                  :class="
                    ctrl.selectedFile?.filePath === node.path ||
                    (node.is_dir && ctrl.currentDir === node.path)
                      ? 'bg-ppx-bg-elevated font-semibold'
                      : ''
                  "
                  :title="node.path"
                  :aria-expanded="node.is_dir ? node.expanded : undefined"
                  :aria-current="ctrl.selectedFile?.filePath === node.path ? 'true' : undefined"
                  :disabled="ctrl.busy"
                  @click="node.is_dir ? ctrl.toggleDirectory(node) : ctrl.openFile(node)"
                >
                  <ChevronDown v-if="node.is_dir && node.expanded" class="h-3 w-3 shrink-0" />
                  <ChevronRight v-else-if="node.is_dir" class="h-3 w-3 shrink-0" />
                  <FolderOpen
                    v-if="node.is_dir && node.expanded"
                    class="text-ppx-accent h-4 w-4 shrink-0"
                  />
                  <Folder v-else-if="node.is_dir" class="text-ppx-accent h-4 w-4 shrink-0" />
                  <ImageIcon
                    v-else-if="isImageNode(node)"
                    class="text-ppx-text-muted h-4 w-4 shrink-0"
                  />
                  <FileText v-else class="text-ppx-text-muted h-4 w-4 shrink-0" />
                  <span class="min-w-0 truncate">{{ node.name }}</span>
                </button>
                <button
                  v-if="!node.is_dir"
                  type="button"
                  class="workspace-icon-button h-7 w-7 shrink-0"
                  :disabled="ctrl.downloadLoading"
                  :aria-label="t('projects.fileBrowser.downloadNamed', { name: node.name })"
                  @click="ctrl.downloadFile(node)"
                >
                  <Download class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="workspace-icon-button text-ppx-danger h-7 w-7 shrink-0"
                  :disabled="ctrl.busy"
                  :aria-label="t('projects.fileBrowser.deleteNamed', { name: node.name })"
                  @click="ctrl.deleteFile(node)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
              <p v-if="node.loading" class="workspace-body px-2 text-xs">
                {{ t('projects.common.loading') }}
              </p>
              <div v-if="node.error" role="alert" class="workspace-body p-2 text-xs wrap-anywhere">
                {{ node.error }}
                <AppButton size="xs" @click="ctrl.loadDirectory(node)">{{
                  t('projects.fileBrowser.refresh')
                }}</AppButton>
              </div>
            </li>
          </ul>
        </aside>
      </template>
      <template #content>
        <div
          class="flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden p-3.5"
          :class="{ 'workspace-panel': !desktop }"
          :aria-busy="ctrl.loading || ctrl.busy"
        >
          <p v-if="ctrl.loading" role="status" class="workspace-body">
            {{ t('projects.common.loading') }}
          </p>
          <template v-if="ctrl.createMode || ctrl.createDirMode">
            <h4 class="workspace-section-title">
              {{ ctrl.createMode ? t('projects.createFile') : t('projects.createDir') }}
            </h4>
            <form
              class="flex min-h-0 flex-1 flex-col gap-3"
              @submit.prevent="ctrl.createMode ? ctrl.confirmCreate() : ctrl.confirmCreateDir()"
            >
              <label class="workspace-label" for="project-new-file">{{
                ctrl.createMode ? t('projects.fileName') : t('projects.dirName')
              }}</label>
              <input
                v-if="ctrl.createMode"
                id="project-new-file"
                v-model="ctrl.newFileName"
                class="workspace-input w-full"
                :disabled="ctrl.busy"
                :placeholder="t('projects.fileNamePlaceholder')"
                required
              />
              <input
                v-else
                id="project-new-file"
                v-model="ctrl.newDirName"
                class="workspace-input w-full"
                :disabled="ctrl.busy"
                :placeholder="t('projects.dirNamePlaceholder')"
                required
              />
              <template v-if="ctrl.createMode">
                <label class="workspace-label" for="project-new-content">{{
                  t('projects.fileContent')
                }}</label>
                <textarea
                  id="project-new-content"
                  v-model="ctrl.newFileContent"
                  class="workspace-textarea min-h-24 w-full flex-1 font-mono text-sm"
                  :disabled="ctrl.busy"
                  :placeholder="t('projects.fileContentPlaceholder')"
                  wrap="soft"
                />
              </template>
              <div class="flex justify-end gap-2">
                <AppButton size="sm" :disabled="ctrl.busy" @click="ctrl.closeSelectedFile">{{
                  t('projects.actions.cancel')
                }}</AppButton>
                <AppButton type="submit" size="sm" variant="solid" :loading="ctrl.busy">{{
                  t('projects.actions.save')
                }}</AppButton>
              </div>
            </form>
          </template>
          <template v-else-if="textSelection">
            <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span
                class="text-ppx-text min-w-0 truncate text-sm font-semibold"
                :title="textSelection.filePath"
                >{{ textSelection.filePath }}</span
              >
              <div class="flex flex-wrap items-center gap-1.5">
                <template v-if="!ctrl.editMode">
                  <AppButton
                    size="xs"
                    variant="outline"
                    :disabled="ctrl.busy || ctrl.loading"
                    @click="ctrl.startEdit"
                    ><Pencil class="h-4 w-4" />{{ t('projects.edit') }}</AppButton
                  >
                  <AppButton
                    size="xs"
                    variant="outline"
                    :loading="ctrl.downloadLoading"
                    @click="downloadSelected"
                    ><Download class="h-4 w-4" />{{ t('projects.fileBrowser.download') }}</AppButton
                  >
                  <AppSelect
                    v-if="textSelection.isMarkdown"
                    v-model="selectedExportFormat"
                    class="min-w-32"
                    size="sm"
                    :disabled="ctrl.exportLoading || ctrl.busy"
                    :placeholder="
                      ctrl.exportLoading
                        ? t('projects.exporting')
                        : t('projects.fileBrowser.convertExport')
                    "
                    :options="
                      exportFormats.map((format) => ({ label: format.label, value: format.key }))
                    "
                  />
                </template>
                <template v-else>
                  <AppButton size="xs" :disabled="ctrl.busy" @click="ctrl.cancelEdit"
                    ><X class="h-4 w-4" />{{ t('projects.actions.cancel') }}</AppButton
                  >
                  <AppButton
                    size="xs"
                    variant="solid"
                    :loading="ctrl.busy"
                    @click="ctrl.confirmEdit"
                    ><Save class="h-4 w-4" />{{ t('projects.actions.save') }}</AppButton
                  >
                </template>
                <AppButton
                  size="xs"
                  variant="outline"
                  tone="rose"
                  :disabled="ctrl.busy"
                  @click="deleteSelected"
                  ><Trash2 class="h-4 w-4" />{{ t('projects.actions.delete') }}</AppButton
                >
                <button
                  type="button"
                  class="workspace-icon-button h-8 w-8"
                  :disabled="ctrl.busy"
                  :aria-label="t('projects.actions.close')"
                  @click="ctrl.closeSelectedFile"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              v-if="ctrl.editMode"
              v-model="ctrl.editContent"
              class="workspace-textarea min-h-0 w-full min-w-0 flex-1 overflow-y-auto font-mono text-sm"
              :disabled="ctrl.busy"
              :aria-label="t('projects.fileContent')"
              wrap="soft"
            />
            <div v-else class="min-h-0 min-w-0 flex-1 overflow-auto">
              <MarkdownContent
                v-if="textSelection.isMarkdown"
                :markdown="textSelection.content"
                :project-id="props.projectId"
                :file-path="textSelection.filePath"
                @paper-click="emit('paperClick', $event)"
              />
              <pre
                v-else
                class="workspace-code bg-ppx-bg-subtle/50 rounded-ppx-interactive m-0 max-w-full p-3 text-sm wrap-anywhere whitespace-pre-wrap"
              ><code>{{ textSelection.content }}</code></pre>
            </div>
          </template>
          <template v-else-if="imageSelection">
            <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span
                class="text-ppx-text min-w-0 truncate text-sm font-semibold"
                :title="imageSelection.filePath"
                >{{ imageSelection.filePath }}</span
              >
              <div class="flex flex-wrap items-center gap-1.5">
                <AppButton
                  size="xs"
                  variant="outline"
                  :disabled="ctrl.busy"
                  @click="copyMarkdownRef"
                  ><Clipboard class="h-4 w-4" />{{ t('projectFiles.copyMarkdownRef') }}</AppButton
                >
                <AppButton
                  size="xs"
                  variant="outline"
                  :loading="ctrl.downloadLoading"
                  @click="downloadSelected"
                  ><Download class="h-4 w-4" />{{ t('projects.fileBrowser.download') }}</AppButton
                >
                <AppButton
                  size="xs"
                  variant="outline"
                  tone="rose"
                  :disabled="ctrl.busy"
                  @click="deleteSelected"
                  ><Trash2 class="h-4 w-4" />{{ t('projects.actions.delete') }}</AppButton
                >
                <button
                  type="button"
                  class="workspace-icon-button h-8 w-8"
                  :disabled="ctrl.busy"
                  :aria-label="t('projects.actions.close')"
                  @click="ctrl.closeSelectedFile"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div class="min-h-0 min-w-0 flex-1 overflow-auto">
              <ProjectFileImage
                :path="imageSelection.filePath"
                :name="imageSelection.name"
                :url="imageSelection.previewUrl"
              />
            </div>
          </template>
          <p v-else-if="!ctrl.loading" class="workspace-body p-4">
            {{ t('projects.fileBrowser.selectFile') }}
          </p>
        </div>
      </template>
    </ProjectFileSplitLayout>
  </section>
</template>
