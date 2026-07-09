<script setup lang="ts">
import { FileText, FolderOpen, FolderPlus, Pencil, Plus, Save, Trash2, X } from 'lucide-vue-next'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppSelect from '@/components/AppSelect.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import {
  useProjectFileBrowserController,
  type ProjectFileExportFormat,
} from '@/composables/useProjectFileBrowserController'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  paperClick: [paperId: string]
}>()

const { t } = useI18n()
const ctrl = useProjectFileBrowserController(toRef(props, 'projectId'))

const exportFormats: { key: ProjectFileExportFormat; label: string }[] = [
  { key: 'markdown', label: 'Markdown' },
  { key: 'docx', label: 'Word' },
  { key: 'pdf', label: 'PDF' },
  { key: 'html', label: 'HTML' },
]

const selectedExportFormat = computed<ProjectFileExportFormat | undefined>({
  get: () => undefined,
  set: (format) => {
    if (!format) return
    void ctrl.exportFile(format)
  },
})

function handlePaperClick(paperId: string): void {
  emit('paperClick', paperId)
}
</script>

<template>
  <section class="animate-fade-in-up flex h-full min-h-0 flex-col space-y-3 overflow-hidden">
    <!-- Breadcrumb -->
    <div class="workspace-panel flex flex-wrap items-center gap-1 p-2">
      <template v-for="(crumb, idx) in ctrl.breadcrumbs" :key="crumb.path">
        <button
          type="button"
          class="text-ppx-text-soft hover:text-ppx-text cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors"
          :class="idx === ctrl.breadcrumbs.length - 1 ? 'text-ppx-text font-semibold' : ''"
          @click="ctrl.navigateToDir(crumb.path)"
        >
          {{ crumb.label }}
        </button>
        <span v-if="idx < ctrl.breadcrumbs.length - 1" class="text-ppx-text-muted text-xs">/</span>
      </template>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-2">
      <h3 class="workspace-section-title text-sm">{{ t('projects.projectFiles') }}</h3>
      <div class="flex items-center gap-1.5">
        <AppButton size="xs" variant="outline" @click="ctrl.startCreateDir">
          <FolderPlus class="h-4 w-4" />
          <span>{{ t('projects.createDir') }}</span>
        </AppButton>
        <AppButton size="xs" variant="outline" @click="ctrl.startCreate">
          <Plus class="h-4 w-4" />
          <span>{{ t('projects.createFile') }}</span>
        </AppButton>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="ctrl.error"
      class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs"
    >
      {{ ctrl.error }}
    </div>

    <!-- Create file form -->
    <div v-if="ctrl.createMode" class="workspace-panel space-y-3 p-3.5">
      <div class="flex items-center justify-between">
        <h4 class="workspace-section-title text-sm">{{ t('projects.createFile') }}</h4>
        <button type="button" class="workspace-icon-button h-7 w-7" @click="ctrl.cancelCreate">
          <X class="h-4 w-4" />
        </button>
      </div>
      <div>
        <label class="workspace-label mb-1">{{ t('projects.fileName') }}</label>
        <input
          v-model="ctrl.newFileName"
          type="text"
          class="workspace-input w-full"
          :placeholder="t('projects.fileNamePlaceholder')"
        />
      </div>
      <div>
        <label class="workspace-label mb-1">{{ t('projects.fileContent') }}</label>
        <textarea
          v-model="ctrl.newFileContent"
          rows="8"
          class="workspace-textarea w-full"
          :placeholder="t('projects.fileContentPlaceholder')"
        />
      </div>
      <div class="flex justify-end gap-2">
        <AppButton size="sm" variant="outline" @click="ctrl.cancelCreate">{{
          t('projects.actions.cancel')
        }}</AppButton>
        <AppButton size="sm" variant="solid" @click="ctrl.confirmCreate">{{
          t('projects.actions.save')
        }}</AppButton>
      </div>
    </div>

    <!-- Create dir form -->
    <div v-if="ctrl.createDirMode" class="workspace-panel space-y-3 p-3.5">
      <div class="flex items-center justify-between">
        <h4 class="workspace-section-title text-sm">{{ t('projects.createDir') }}</h4>
        <button type="button" class="workspace-icon-button h-7 w-7" @click="ctrl.cancelCreateDir">
          <X class="h-4 w-4" />
        </button>
      </div>
      <div>
        <label class="workspace-label mb-1">{{ t('projects.dirName') }}</label>
        <input
          v-model="ctrl.newDirName"
          type="text"
          class="workspace-input w-full"
          :placeholder="t('projects.dirNamePlaceholder')"
        />
      </div>
      <div class="flex justify-end gap-2">
        <AppButton size="sm" variant="outline" @click="ctrl.cancelCreateDir">{{
          t('projects.actions.cancel')
        }}</AppButton>
        <AppButton size="sm" variant="solid" @click="ctrl.confirmCreateDir">{{
          t('projects.actions.save')
        }}</AppButton>
      </div>
    </div>

    <!-- File list -->
    <div
      v-if="!ctrl.selectedFile && !ctrl.createMode && !ctrl.createDirMode"
      class="workspace-panel max-h-full min-h-0 overflow-auto p-0"
    >
      <div
        v-if="ctrl.loading && ctrl.items.length === 0"
        class="flex items-center justify-center p-6"
      >
        <div class="text-ppx-text-muted text-sm">{{ t('projects.common.loading') }}</div>
      </div>
      <div v-else-if="ctrl.items.length === 0" class="workspace-body p-4 text-sm">
        {{ t('projects.noFiles') }}
      </div>
      <div v-else class="divide-ppx-border divide-y">
        <div
          v-for="item in ctrl.items"
          :key="item.name"
          class="group flex shrink-0 cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 transition-colors"
          :class="item.is_dir ? 'hover:bg-ppx-bg-subtle/60 cursor-pointer' : ''"
          @click="item.is_dir ? ctrl.enterDir(item) : ctrl.openFile(item)"
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
              type="button"
              class="workspace-icon-button text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-ppx-danger-soft h-8 w-8 cursor-pointer focus-visible:ring-3"
              :title="t('projects.actions.delete')"
              @click.stop="ctrl.deleteFile(item)"
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
    <div
      v-if="ctrl.selectedFile"
      class="workspace-panel flex max-h-full min-h-0 flex-1 flex-col space-y-3 overflow-hidden p-3.5"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <FileText class="text-ppx-text-muted h-4 w-4 shrink-0" />
          <span class="text-ppx-text min-w-0 truncate text-sm font-semibold">{{
            ctrl.selectedFile.filePath
          }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <template v-if="!ctrl.editMode">
            <AppButton size="xs" variant="outline" @click="ctrl.startEdit">
              <Pencil class="h-4 w-4" />
              <span>{{ t('projects.edit') }}</span>
            </AppButton>
            <template v-if="ctrl.selectedFile.isMarkdown">
              <AppSelect
                v-model="selectedExportFormat"
                class="min-w-32"
                size="sm"
                :disabled="ctrl.exportLoading"
                :placeholder="
                  ctrl.exportLoading ? t('projects.exporting') : t('projects.exportFile')
                "
                :options="exportFormats.map((fmt) => ({ label: fmt.label, value: fmt.key }))"
              />
            </template>
          </template>
          <template v-else>
            <AppButton size="xs" variant="outline" @click="ctrl.cancelEdit">
              <X class="h-4 w-4" />
              <span>{{ t('projects.actions.cancel') }}</span>
            </AppButton>
            <AppButton size="xs" variant="solid" @click="ctrl.confirmEdit">
              <Save class="h-4 w-4" />
              <span>{{ t('projects.actions.save') }}</span>
            </AppButton>
          </template>
          <button
            type="button"
            class="workspace-icon-button border-ppx-border-strong text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-ppx-danger-soft h-8 w-8 focus-visible:ring-3"
            :title="t('projects.actions.delete')"
            @click="
              ctrl.deleteFile({
                name: ctrl.selectedFile.filePath.split('/').pop()!,
                is_dir: false,
                size: null,
              })
            "
          >
            <Trash2
              class="text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-ppx-danger-soft h-4 w-4 focus-visible:ring-3"
            />
          </button>
          <button
            type="button"
            class="workspace-icon-button h-8 w-8"
            :title="t('projects.actions.close')"
            @click="ctrl.closeSelectedFile"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- View mode -->
      <div v-if="!ctrl.editMode" class="min-h-0 flex-1 overflow-y-auto">
        <MarkdownContent
          v-if="ctrl.selectedFile.isMarkdown"
          :markdown="ctrl.selectedFile.content"
          @paper-click="handlePaperClick($event)"
        />
        <pre
          v-else
          class="workspace-code bg-ppx-bg-subtle/50 overflow-x-auto rounded-lg p-3 text-sm"
        ><code>{{ ctrl.selectedFile.content }}</code></pre>
      </div>

      <!-- Edit mode -->
      <textarea
        v-if="ctrl.editMode"
        v-model="ctrl.editContent"
        rows="12"
        class="workspace-textarea min-h-0 w-full flex-1 overflow-y-auto font-mono text-sm"
      />
    </div>
  </section>
</template>
