<script setup lang="ts">
import { Folder, FolderPlus } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppModalShell from '@/components/AppModalShell.vue'
import SimpleSearchBar from '@/components/SimpleSearchBar.vue'
import type { ProjectResponse } from '@/types/api'

const keyword = defineModel<string>('keyword', {
  default: '',
})

const props = defineProps<{
  open: boolean
  projects: ProjectResponse[]
}>()

const emit = defineEmits<{
  close: []
  createProject: []
  openProject: [projectId: string]
}>()

const { t } = useI18n()

const searchProjects = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return props.projects.slice(0, 5)
  }
  return props.projects.filter((project) => {
    const haystacks = [project.name, project.description ?? '', project.project_id]
    return haystacks.some((value) => value.toLowerCase().includes(search))
  })
})
</script>

<template>
  <AppModalShell
    :open="open"
    :title="t('projects.sidebar.searchTitle')"
    width-class="max-w-3xl"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <SimpleSearchBar
        v-model="keyword"
        variant="elevated"
        :placeholder="t('projects.sidebar.searchPlaceholder')"
      />

      <div :key="keyword" class="animate-fade-in-up space-y-1">
        <button
          type="button"
          class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          @click="emit('createProject')"
        >
          <FolderPlus class="text-ppx-text-soft h-4 w-4 shrink-0" />
          <div class="min-w-0">
            <div class="text-ppx-text-soft truncate font-medium">
              {{ t('projects.sidebar.createInline') }}
            </div>
            <div class="text-ppx-text-soft truncate text-xs">
              {{ t('projects.subtitle') }}
            </div>
          </div>
        </button>

        <button
          v-for="project in searchProjects"
          :key="`search-${project.project_id}`"
          type="button"
          class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          @click="emit('openProject', project.project_id)"
        >
          <Folder class="text-ppx-text-soft h-4 w-4 shrink-0" />
          <div class="min-w-0">
            <div class="text-ppx-text-soft truncate font-medium">{{ project.name }}</div>
            <div class="text-ppx-text-soft truncate text-xs">
              {{ project.description || project.project_id }}
            </div>
          </div>
        </button>
        <div v-if="searchProjects.length === 0" class="workspace-body px-3 py-6 text-center">
          {{ t('projects.sidebar.searchEmpty') }}
        </div>
      </div>
    </div>
  </AppModalShell>
</template>
