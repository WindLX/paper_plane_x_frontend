<script setup lang="ts">
import { ChevronDown, Folder, FolderPlus, Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProjectResponse } from '@/types/api'

const props = defineProps<{
  projects: ProjectResponse[]
  activeProjectId?: string | null
  collapsed?: boolean
}>()

const emit = defineEmits<{
  openProject: [projectId: string]
  openCreateModal: []
  openSearchModal: []
}>()

const { t } = useI18n()

const projectsOpen = ref(true)
const projectsGroupOpen = ref({
  recent7: true,
  recent30: true,
  older: true,
})

const groupedProjects = computed(() => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const recent7: ProjectResponse[] = []
  const recent30: ProjectResponse[] = []
  const older: ProjectResponse[] = []

  props.projects.forEach((project) => {
    const updatedAt = new Date(project.updated_at).getTime()
    const diffDays = Number.isFinite(updatedAt) ? (now - updatedAt) / oneDay : 365
    if (diffDays <= 7) {
      recent7.push(project)
    } else if (diffDays <= 30) {
      recent30.push(project)
    } else {
      older.push(project)
    }
  })

  return [
    { key: 'recent7', label: t('projects.sidebar.groupRecent7'), projects: recent7 },
    { key: 'recent30', label: t('projects.sidebar.groupRecent30'), projects: recent30 },
    { key: 'older', label: t('projects.sidebar.groupOlder'), projects: older },
  ] as const
})

function groupHasActive(groupProjects: readonly ProjectResponse[]): boolean {
  return groupProjects.some((project) => projectIsActive(project))
}

function groupExpanded(
  key: keyof typeof projectsGroupOpen.value,
  groupProjects: readonly ProjectResponse[],
): boolean {
  return groupHasActive(groupProjects) || projectsGroupOpen.value[key]
}

function toggleGroup(
  key: keyof typeof projectsGroupOpen.value,
  groupProjects: readonly ProjectResponse[],
): void {
  if (groupHasActive(groupProjects)) return
  projectsGroupOpen.value[key] = !projectsGroupOpen.value[key]
}

function projectIsActive(project: ProjectResponse): boolean {
  return props.activeProjectId === project.project_id
}
</script>

<template>
  <section class="border-ppx-border min-h-0 flex-1 overflow-y-auto border-t pt-3">
    <button
      v-if="!props.collapsed"
      type="button"
      class="text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-8 w-full cursor-pointer items-center justify-between rounded-xl px-2 text-left text-sm font-semibold transition-colors"
      @click="projectsOpen = !projectsOpen"
    >
      <span>{{ t('projects.sidebar.projects') }}</span>
      <ChevronDown
        class="text-ppx-text-soft duration-ppx-fast h-4 w-4 transition-transform"
        :class="projectsOpen ? '' : '-rotate-90'"
      />
    </button>

    <div
      class="duration-ppx-standard ease-ppx grid transition-all"
      :class="projectsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="mt-1 min-h-0 space-y-1 pb-2">
        <button
          type="button"
          class="group duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm font-medium transition-colors"
          :class="props.collapsed ? 'justify-center' : ''"
          @click="emit('openCreateModal')"
        >
          <FolderPlus class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
          <span v-if="!props.collapsed">{{ t('projects.sidebar.createInline') }}</span>
        </button>

        <button
          type="button"
          class="group duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm font-medium transition-colors"
          :class="props.collapsed ? 'justify-center' : ''"
          @click="emit('openSearchModal')"
        >
          <Search class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
          <span v-if="!props.collapsed">{{ t('projects.sidebar.searchInline') }}</span>
        </button>

        <template v-if="!props.collapsed">
          <section
            v-for="group in groupedProjects"
            :key="group.key"
            class="border-ppx-border border-t pt-2 first:border-t-0"
          >
            <button
              type="button"
              class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-8 w-full cursor-pointer items-center justify-between rounded-xl px-2 text-left text-sm font-semibold transition-colors"
              @click="toggleGroup(group.key, group.projects)"
            >
              <span>{{ group.label }}</span>
              <ChevronDown
                class="duration-ppx-fast h-3.5 w-3.5 transition-transform"
                :class="groupExpanded(group.key, group.projects) ? '' : '-rotate-90'"
              />
            </button>
            <div
              class="duration-ppx-standard ease-ppx grid transition-all"
              :class="
                groupExpanded(group.key, group.projects)
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              "
            >
              <div class="min-h-0 space-y-1">
                <button
                  v-for="project in group.projects"
                  :key="project.project_id"
                  type="button"
                  class="group duration-ppx-fast flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-left text-sm font-medium transition-colors"
                  :class="
                    projectIsActive(project)
                      ? 'bg-ppx-bg-elevated text-ppx-text shadow-ppx-rest'
                      : 'text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text'
                  "
                  @click="emit('openProject', project.project_id)"
                >
                  <Folder
                    class="h-4 w-4 shrink-0"
                    :class="
                      projectIsActive(project) ? '' : 'text-ppx-text-soft group-hover:text-current'
                    "
                  />
                  <span class="truncate">{{ project.name }}</span>
                </button>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
