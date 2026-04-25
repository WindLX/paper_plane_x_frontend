<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDownUp, ArrowDownWideNarrow, ArrowUpWideNarrow, FolderOpen, Plus, Search, Trash2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { api } from '../api/client'
import AppButton from '../components/AppButton.vue'
import { useDialog } from '../composables/dialog'
import { useNotify } from '../composables/notify'
import { useTriSort } from '../composables/triSort'
import CopyableText from '../components/CopyableText.vue'
import { useProjectStore } from '../stores/projects'
import { formatDateTime } from '../utils/format'

const projectStore = useProjectStore()
const dialog = useDialog()
const notify = useNotify()
const { t } = useI18n()
const name = ref('')
const description = ref('')
const submitting = ref(false)
const keyword = ref('')
const lastErrorNotified = ref<string | null>(null)
const { sortField, sortOrder, toggleSort } = useTriSort<'created' | 'updated'>()

onMounted(() => {
  void projectStore.fetchProjects()
})

async function createProject(): Promise<void> {
  if (!name.value.trim()) return
  submitting.value = true
  try {
    await projectStore.createProject(name.value.trim(), description.value.trim() || null)
    name.value = ''
    description.value = ''
  } finally {
    submitting.value = false
  }
}

async function removeProjectWithConfirm(projectId: string): Promise<void> {
  let paperCount = 0
  try {
    const paperPayload = await api.listProjectPapers(projectId, 0, 1)
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

const sortedProjects = computed(() => {
  const items = [...filteredProjects.value]
  if (sortField.value === 'none' || sortOrder.value === 'default') {
    return items
  }
  const key = sortField.value === 'created' ? 'created_at' : 'updated_at'
  items.sort((a, b) => {
    const av = new Date(a[key]).getTime()
    const bv = new Date(b[key]).getTime()
    return sortOrder.value === 'asc' ? av - bv : bv - av
  })
  return items
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
        {{ t('common.total') }}: {{ projectStore.projects.length }} · {{ t('common.showing') }}: {{ sortedProjects.length }}
      </p>
    </header>

    <form
      class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-6"
      @submit.prevent="createProject">
      <input v-model="name" :placeholder="t('projects.namePlaceholder')"
        class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-slate-600 dark:bg-slate-950 md:col-span-2" />
      <input v-model="description" :placeholder="t('projects.descriptionPlaceholder')"
        class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-slate-600 dark:bg-slate-950 md:col-span-3" />
      <AppButton type="submit" :disabled="submitting" tone="sky" variant="solid" size="md">
        <Plus class="h-4 w-4" />
        <span>{{ t('actions.create') }}</span>
      </AppButton>
    </form>

    <div
      class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <Search class="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <input v-model="keyword" :placeholder="t('projects.searchPlaceholder')"
        class="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead class="bg-slate-50 dark:bg-slate-800">
          <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            <th class="px-3 py-2">#</th>
            <th class="px-3 py-2">{{ t('projects.table.projectId') }}</th>
            <th class="px-3 py-2">{{ t('projects.table.name') }}</th>
            <th class="px-3 py-2">{{ t('projects.table.description') }}</th>
            <th class="px-3 py-2">
              <AppButton size="xs" @click="toggleSort('created')">
                <span>{{ t('projects.table.created') }}</span>
                <ArrowUpWideNarrow v-if="sortField === 'created' && sortOrder === 'asc'" class="h-3.5 w-3.5" />
                <ArrowDownWideNarrow v-else-if="sortField === 'created' && sortOrder === 'desc'" class="h-3.5 w-3.5" />
                <ArrowDownUp v-else class="h-3.5 w-3.5" />
              </AppButton>
            </th>
            <th class="px-3 py-2">
              <AppButton size="xs" @click="toggleSort('updated')">
                <span>{{ t('projects.table.updated') }}</span>
                <ArrowUpWideNarrow v-if="sortField === 'updated' && sortOrder === 'asc'" class="h-3.5 w-3.5" />
                <ArrowDownWideNarrow v-else-if="sortField === 'updated' && sortOrder === 'desc'" class="h-3.5 w-3.5" />
                <ArrowDownUp v-else class="h-3.5 w-3.5" />
              </AppButton>
            </th>
            <th class="px-3 py-2">{{ t('projects.table.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="(project, index) in sortedProjects" :key="project.project_id">
            <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{{ index + 1 }}</td>
            <td class="px-3 py-2">
              <CopyableText :text="project.project_id" mono />
            </td>
            <td class="px-3 py-2">{{ project.name }}</td>
            <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ project.description ?? '-' }}</td>
            <td class="px-3 py-2 text-xs">{{ formatDateTime(project.created_at) }}</td>
            <td class="px-3 py-2 text-xs">{{ formatDateTime(project.updated_at) }}</td>
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <RouterLink :to="`/projects/${project.project_id}`"
                  class="inline-flex items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-slate-800">
                  <FolderOpen class="h-3.5 w-3.5" />
                  <span>{{ t('actions.open') }}</span>
                </RouterLink>
                <AppButton tone="rose" size="xs" @click="removeProjectWithConfirm(project.project_id)">
                  <Trash2 class="h-3.5 w-3.5" />
                  <span>{{ t('actions.delete') }}</span>
                </AppButton>
              </div>
            </td>
          </tr>
          <tr v-if="sortedProjects.length === 0">
            <td colspan="7" class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {{ t('projects.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
