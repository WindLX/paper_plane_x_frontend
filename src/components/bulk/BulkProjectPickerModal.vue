<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Folder, LoaderCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import type { ProjectResponse } from '@/types/api'
import AppModalShell from '../AppModalShell.vue'
import SimpleSearchBar from '../SimpleSearchBar.vue'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  select: [projectId: string]
  close: []
}>()

const { t } = useI18n()
const keyword = ref('')
const projects = ref<ProjectResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let requestId = 0

const filteredProjects = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return projects.value
  return projects.value.filter((project) =>
    [project.name, project.description ?? '', project.project_id].some((field) =>
      field.toLowerCase().includes(query),
    ),
  )
})

async function loadProjects(): Promise<void> {
  const id = ++requestId
  loading.value = true
  error.value = null
  try {
    const payload = await api.listProjects(0, 100, 'desc', 'updated_at')
    if (id !== requestId) return
    projects.value = payload.items
  } catch (err) {
    if (id !== requestId) return
    projects.value = []
    error.value = err instanceof Error ? err.message : t('projects.errors.listProjects')
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      requestId += 1
      return
    }
    keyword.value = ''
    void loadProjects()
  },
)
</script>

<template>
  <AppModalShell
    :open="props.open"
    :title="props.title"
    width-class="max-w-2xl"
    z-index="z-[60]"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <SimpleSearchBar
        v-model="keyword"
        variant="elevated"
        :placeholder="t('sidebar.project.searchPlaceholder')"
      />

      <div v-if="loading" class="flex items-center justify-center gap-2 py-8 text-sm">
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div
        v-else-if="error"
        class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs"
        role="alert"
      >
        <span class="wrap-break-word">{{ error }}</span>
      </div>

      <div v-else class="max-h-80 space-y-1 overflow-y-auto">
        <button
          v-for="project in filteredProjects"
          :key="project.project_id"
          type="button"
          class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          @click="emit('select', project.project_id)"
        >
          <Folder class="text-ppx-text-soft h-4 w-4 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ project.name }}</div>
            <div class="text-ppx-text-soft truncate text-xs">
              {{ project.description || project.project_id }}
            </div>
          </div>
        </button>

        <div v-if="filteredProjects.length === 0" class="workspace-body px-3 py-6 text-center">
          {{ t('sidebar.project.searchEmpty') }}
        </div>
      </div>
    </div>
  </AppModalShell>
</template>
