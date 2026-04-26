<script setup lang="ts">
import {
    FolderOpen,
    Trash2,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'
import SortButton from '../SortButton.vue'
import type { ProjectResponse } from '../../types/api'
import type { SortOrder, ProjectSortKey } from '../../types/sort'
import { formatDateTime } from '../../utils/format'

const props = defineProps<{
    projects: ProjectResponse[]
    offset: number
    sortBy: ProjectSortKey
    sortOrder: SortOrder
}>()

const emit = defineEmits<{
    sort: [field: ProjectSortKey]
    remove: [projectId: string]
}>()

const { t } = useI18n()
</script>

<template>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <th class="px-3 py-2">#</th>
                    <th class="px-3 py-2">{{ t('projects.table.projectId') }}</th>
                    <th class="px-3 py-2">
                        <SortButton :label="t('projects.table.name')" :active="props.sortBy === 'name'"
                            :order="props.sortBy === 'name' ? props.sortOrder : 'default'"
                            @click="emit('sort', 'name')" />
                    </th>
                    <th class="px-3 py-2">{{ t('projects.table.description') }}</th>
                    <th class="px-3 py-2">
                        <SortButton :label="t('projects.table.created')" :active="props.sortBy === 'created_at'"
                            :order="props.sortBy === 'created_at' ? props.sortOrder : 'default'"
                            @click="emit('sort', 'created_at')" />
                    </th>
                    <th class="px-3 py-2">
                        <SortButton :label="t('projects.table.updated')" :active="props.sortBy === 'updated_at'"
                            :order="props.sortBy === 'updated_at' ? props.sortOrder : 'default'"
                            @click="emit('sort', 'updated_at')" />
                    </th>
                    <th class="px-3 py-2">{{ t('projects.table.actions') }}</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="(project, index) in props.projects" :key="project.project_id">
                    <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{{ props.offset + index + 1 }}</td>
                    <td class="px-3 py-2">
                        <CopyableText :text="project.project_id" mono />
                    </td>
                    <td class="px-3 py-2">{{ project.name }}</td>
                    <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ project.description ?? '-' }}</td>
                    <td class="min-w-28 px-3 py-2 text-xs">{{ formatDateTime(project.created_at) }}</td>
                    <td class="min-w-28 px-3 py-2 text-xs">{{ formatDateTime(project.updated_at) }}</td>
                    <td class="px-3 py-2">
                        <div class="flex items-center gap-2">
                            <RouterLink :to="`/projects/${project.project_id}`"
                                class="inline-flex items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-slate-800">
                                <FolderOpen class="h-3.5 w-3.5" />
                                <span>{{ t('actions.open') }}</span>
                            </RouterLink>
                            <AppButton tone="rose" size="xs" @click="emit('remove', project.project_id)">
                                <Trash2 class="h-3.5 w-3.5" />
                                <span>{{ t('actions.delete') }}</span>
                            </AppButton>
                        </div>
                    </td>
                </tr>
                <tr v-if="props.projects.length === 0">
                    <td colspan="7" class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        {{ t('projects.empty') }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
