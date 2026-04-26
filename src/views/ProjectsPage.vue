<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '../api/client'
import PagerBar from '../components/PagerBar.vue'
import ProjectCreateForm from '../components/project/ProjectCreateForm.vue'
import ProjectListTable from '../components/project/ProjectListTable.vue'
import SimpleSearchBar from '../components/SimpleSearchBar.vue'
import { useDialog } from '../composables/dialog'
import { useNotify } from '../composables/notify'
import { useProjectStore } from '../stores/projects'

const projectStore = useProjectStore()
const dialog = useDialog()
const notify = useNotify()
const { t } = useI18n()
const keyword = ref('')
const lastErrorNotified = ref<string | null>(null)

onMounted(async () => {
  await projectStore.fetchProjects({ offset: 0, limit: 20 })
})

async function handleCreate(name: string, description: string | null): Promise<void> {
  await projectStore.createProject(name, description)
}

async function removeProjectWithConfirm(projectId: string): Promise<void> {
  let paperCount = 0
  try {
    const paperPayload = await api.librarianSearch({ project_id: projectId, limit: 1, offset: 0 })
    paperCount = paperPayload.total
  } catch {
    const fallbackConfirm = await dialog.confirm({
      title: t('projects.deleteTitle'),
      message: t('projects.deleteConfirmSimple', { projectId }),
      confirmText: t('actions.delete'),
      tone: 'danger',
    })
    if (!fallbackConfirm) {
      return
    }
    await projectStore.removeProject(projectId)
    notify.push(t('projects.deleted', { projectId }), 'success')
    return
  }

  const message =
    paperCount > 0
      ? t('projects.deleteConfirmWithPapers', { projectId, paperCount })
      : t('projects.deleteConfirmSimple', { projectId })
  const confirmed = await dialog.confirm({
    title: t('projects.deleteTitle'),
    message,
    confirmText: t('actions.delete'),
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  await projectStore.removeProject(projectId)
  notify.push(t('projects.deleted', { projectId }), 'success')
}

const filteredProjects = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return projectStore.projects
  }
  return projectStore.projects.filter((project) => {
    const haystacks = [
      project.project_id,
      project.name,
      project.description ?? '',
    ]
    return haystacks.some((value) => value.toLowerCase().includes(search))
  })
})

watch(
  () => projectStore.error,
  (error) => {
    if (!error) {
      lastErrorNotified.value = null
      return
    }
    if (lastErrorNotified.value === error) {
      return
    }
    notify.push(error, 'error', 3600)
    lastErrorNotified.value = error
  },
)
</script>

<template>
  <section class="space-y-6">
    <header>
      <h2 class="text-xl font-semibold">{{ t('projects.title') }}</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('projects.subtitle') }}</p>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {{ t('common.total') }}: {{ projectStore.total }} · {{ t('common.showing') }}: {{
          filteredProjects.length }}
      </p>
    </header>

    <ProjectCreateForm :on-create="handleCreate" />

    <SimpleSearchBar :placeholder="t('projects.searchPlaceholder')" v-model="keyword" />

    <ProjectListTable :projects="filteredProjects" :offset="projectStore.offset" :sort-by="projectStore.sortBy"
      :sort-order="projectStore.sortOrder" @sort="projectStore.toggleSort" @remove="removeProjectWithConfirm" />

    <PagerBar :current-page="projectStore.currentPage" :total-pages="projectStore.totalPages"
      :total-count="projectStore.total" :rows-per-page="projectStore.limit" @prev-page="projectStore.prevPage()"
      @next-page="projectStore.nextPage()" @set-page="projectStore.setPage" @set-limit="projectStore.setLimit" />
  </section>
</template>
