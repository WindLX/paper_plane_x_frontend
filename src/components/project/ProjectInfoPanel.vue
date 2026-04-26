<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import CopyableText from '../CopyableText.vue'
import type { ProjectResponse } from '../../types/api'
import { formatDateTime } from '../../utils/format'

const props = defineProps<{
    project?: ProjectResponse
    projectId: string
}>()

const { t } = useI18n()
</script>

<template>
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-xl font-semibold">{{ t('projectDetail.title') }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ props.project?.name ?? props.projectId }}</p>
        </div>
        <div class="flex items-center gap-2">
            <RouterLink to="/projects"
                class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <ArrowLeft class="h-4 w-4" />
                <span>{{ t('actions.back') }}</span>
            </RouterLink>
        </div>
    </div>

    <div
        class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <div>
            <span class="text-xs text-slate-500">{{ t('projectDetail.projectId') }}</span>
            <div>
                <CopyableText :text="props.projectId" mono />
            </div>
        </div>
        <div>
            <span class="text-xs text-slate-500">{{ t('projectDetail.description') }}</span>
            <div class="text-sm">{{ props.project?.description ?? '-' }}</div>
        </div>
        <div>
            <span class="text-xs text-slate-500">{{ t('projectDetail.created') }}</span>
            <div class="text-sm">{{ props.project ? formatDateTime(props.project.created_at) : '-' }}</div>
        </div>
        <div>
            <span class="text-xs text-slate-500">{{ t('projectDetail.updated') }}</span>
            <div class="text-sm">{{ props.project ? formatDateTime(props.project.updated_at) : '-' }}</div>
        </div>
    </div>
</template>
