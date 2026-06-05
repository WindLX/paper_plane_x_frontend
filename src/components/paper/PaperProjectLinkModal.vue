<script setup lang="ts">
import { Folder, LoaderCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppModalShell from '../AppModalShell.vue'
import SimpleSearchBar from '../SimpleSearchBar.vue'
import VirtualScrollList from '../VirtualScrollList.vue'

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
    :title="t('sidebar.project.searchModalTitle')"
    width-class="max-w-3xl"
    z-index="z-[60]"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <SimpleSearchBar
        v-model="projectKeyword"
        variant="elevated"
        :placeholder="t('sidebar.project.searchPlaceholder')"
      />

      <div
        v-if="props.projectSearchLoading"
        class="flex items-center justify-center gap-2 py-8 text-sm"
      >
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else :key="projectKeyword" class="animate-fade-in-up space-y-1">
        <VirtualScrollList
          v-if="props.availableProjects.length > 0"
          :items="props.availableProjects"
          :window-size="20"
          :step-size="10"
          key-field="project_id"
        >
          <template #default="{ item: project }">
            <button
              type="button"
              class="duration-ppx-fast flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
              :class="
                props.isPaperLinkedToProject(project.project_id)
                  ? 'text-ppx-text-soft cursor-not-allowed opacity-60'
                  : 'text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text cursor-pointer'
              "
              :disabled="props.isPaperLinkedToProject(project.project_id)"
              @click="emit('linkToProject', project.project_id)"
            >
              <Folder class="text-ppx-text-soft h-4 w-4 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium">{{ project.name }}</div>
                <div class="text-ppx-text-soft truncate text-xs">
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
          </template>
        </VirtualScrollList>

        <div
          v-if="props.availableProjects.length === 0"
          class="workspace-body px-3 py-6 text-center"
        >
          {{ t('sidebar.project.searchEmpty') }}
        </div>
      </div>
    </div>
  </AppModalShell>
</template>
