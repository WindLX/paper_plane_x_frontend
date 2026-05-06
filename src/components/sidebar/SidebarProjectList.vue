<script setup lang="ts">
import { Folder, FolderPlus, Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import SidebarButton from './SidebarButton.vue'
import VirtualScrollList from '@/components/VirtualScrollList.vue'
import type { ProjectResponse } from '@/types/api'

const props = defineProps<{
  projects: ProjectResponse[]
  activeProjectId?: string | null
  collapsed?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  openProject: [projectId: string]
  openCreateModal: []
  openSearchModal: []
}>()

const { t } = useI18n()

const projectsOpen = ref(true)

type FlatEntry =
  | { _type: 'group-header'; _key: string; key: string; label: string; count: number }
  | { _type: 'item'; _key: string; project: ProjectResponse }

const flatItems = computed<FlatEntry[]>(() => {
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

  const result: FlatEntry[] = []
  if (recent7.length) {
    result.push({
      _type: 'group-header',
      _key: 'gh-recent7',
      key: 'recent7',
      label: t('sidebar.project.groupRecent7'),
      count: recent7.length,
    })
    result.push(
      ...recent7.map((p) => ({ _type: 'item' as const, _key: `p-${p.project_id}`, project: p })),
    )
  }
  if (recent30.length) {
    result.push({
      _type: 'group-header',
      _key: 'gh-recent30',
      key: 'recent30',
      label: t('sidebar.project.groupRecent30'),
      count: recent30.length,
    })
    result.push(
      ...recent30.map((p) => ({ _type: 'item' as const, _key: `p-${p.project_id}`, project: p })),
    )
  }
  if (older.length) {
    result.push({
      _type: 'group-header',
      _key: 'gh-older',
      key: 'older',
      label: t('sidebar.project.groupOlder'),
      count: older.length,
    })
    result.push(
      ...older.map((p) => ({ _type: 'item' as const, _key: `p-${p.project_id}`, project: p })),
    )
  }
  return result
})

function projectIsActive(project: ProjectResponse): boolean {
  return props.activeProjectId === project.project_id
}
</script>

<template>
  <section class="border-ppx-border flex min-h-0 flex-1 flex-col border-t pt-3">
    <SidebarButton
      v-if="!props.collapsed"
      variant="toggle"
      :open="projectsOpen"
      @click="projectsOpen = !projectsOpen"
    >
      {{ t('sidebar.project.project') }}
    </SidebarButton>

    <div v-show="projectsOpen" class="mt-1 flex min-h-0 flex-col overflow-hidden pb-2">
      <SidebarButton variant="action" :collapsed="props.collapsed" @click="emit('openCreateModal')">
        <template #icon>
          <FolderPlus class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
        </template>
        {{ t('sidebar.project.createInline') }}
      </SidebarButton>

      <SidebarButton variant="action" :collapsed="props.collapsed" @click="emit('openSearchModal')">
        <template #icon>
          <Search class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
        </template>
        {{ t('sidebar.project.searchInline') }}
      </SidebarButton>

      <template v-if="!props.collapsed">
        <div
          v-if="props.loading && flatItems.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <p class="text-ppx-text-muted text-xs">{{ t('common.loading') }}</p>
        </div>
        <VirtualScrollList
          v-else-if="flatItems.length > 0"
          :items="flatItems"
          :window-size="30"
          :step-size="10"
          key-field="_key"
          class="min-h-0 flex-1"
        >
          <template #default="{ item: entry }">
            <!-- Group header -->
            <div
              v-if="entry._type === 'group-header'"
              class="text-ppx-text-soft border-ppx-border pt-2.5 pb-1 pl-2 text-xs font-semibold tracking-wide uppercase first:pt-1"
            >
              {{ entry.label }}
            </div>
            <!-- Project item -->
            <SidebarButton
              v-else
              variant="item"
              :active="projectIsActive(entry.project)"
              @click="emit('openProject', entry.project.project_id)"
            >
              <template #icon>
                <Folder
                  class="h-4 w-4 shrink-0"
                  :class="
                    projectIsActive(entry.project)
                      ? ''
                      : 'text-ppx-text-soft group-hover:text-current'
                  "
                />
              </template>
              {{ entry.project.name }}
            </SidebarButton>
          </template>
        </VirtualScrollList>
        <div v-else class="flex flex-col items-center justify-center py-12 text-center">
          <p class="text-ppx-text-muted text-xs">{{ t('sidebar.project.empty') }}</p>
        </div>
      </template>
    </div>
  </section>
</template>
