<script setup lang="ts">
import { Folder, LoaderCircle, Search } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppModalShell from '../AppModalShell.vue'

const props = defineProps<{
  open: boolean
  paperId: string
  availableProjects: Array<{ project_id: string; name: string; description: string | null }>
  projectSearchLoading: boolean
  isPaperLinkedToProject: (projectId: string) => boolean
}>()

const projectKeyword = defineModel<string>('projectKeyword', { default: '' })

const emit = defineEmits<{
  linkToProject: [projectId: string]
  close: []
}>()

const { t } = useI18n()
</script>

<template>
  <AppModalShell
    :open="props.open"
    :title="t('projects.sidebar.searchTitle')"
    width-class="max-w-3xl"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <label class="workspace-panel flex items-center gap-2 px-3 py-2.5">
        <Search class="workspace-muted h-4 w-4" />
        <input
          v-model="projectKeyword"
          :placeholder="t('projects.sidebar.searchPlaceholder')"
          class="text-ppx-text w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div
        v-if="props.projectSearchLoading"
        class="workspace-body flex items-center justify-center gap-2 py-8 text-sm"
      >
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else class="space-y-1">
        <button
          v-for="project in props.availableProjects"
          :key="`project-link-${project.project_id}`"
          type="button"
          class="duration-ppx-fast flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          :class="
            props.isPaperLinkedToProject(project.project_id)
              ? 'text-ppx-text-muted cursor-not-allowed opacity-60'
              : 'text-ppx-text hover:bg-ppx-bg-subtle cursor-pointer'
          "
          :disabled="props.isPaperLinkedToProject(project.project_id)"
          @click="emit('linkToProject', project.project_id)"
        >
          <Folder class="text-ppx-text-muted h-4 w-4 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ project.name }}</div>
            <div class="text-ppx-text-muted truncate text-xs">
              {{ project.description || project.project_id }}
            </div>
          </div>
          <span
            v-if="props.isPaperLinkedToProject(project.project_id)"
            class="workspace-badge workspace-badge--neutral px-2 py-0.5 text-xs"
          >
            {{ t('paper.alreadyLinked') }}
          </span>
        </button>
        <div
          v-if="props.availableProjects.length === 0"
          class="workspace-body px-3 py-6 text-center"
        >
          {{ t('projects.sidebar.searchEmpty') }}
        </div>
      </div>
    </div>
  </AppModalShell>
</template>
