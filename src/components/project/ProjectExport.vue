<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, FileJson, Download, X, CheckSquare } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '../../api/client';
import { useNotify } from '../../composables/notify';
import AppButton from '../AppButton.vue';
import type { ProjectExportField } from '../../types/api';

const props = defineProps<{
    projectId: string
}>()

const notify = useNotify()
const { t } = useI18n()

const exporting = ref(false)
const exportCitationsMode = ref<'keep' | 'strip'>('keep')

const EXPORT_FIELDS: ProjectExportField[] = [
    'paper_id',
    'project_ids',
    'title',
    'authors',
    'year',
    'publication',
    'doi',
    'custom_meta',
    'raw_pdf_path',
    'raw_pdf_sha256',
    'images_paths',
    'extraction_status',
    'extraction_fact_check_status',
    'analysis_fact_check_status',
    'extraction_retry_count',
    'analysis_retry_count',
    'created_at',
    'updated_at',
    'quick_scan',
    'synthesis_data',
    'analysis_report',
    'extraction_fact_check_result',
    'analysis_fact_check_result',
]
const selectedExportFields = ref<ProjectExportField[]>([...EXPORT_FIELDS])

function selectAllExportFields(): void {
    selectedExportFields.value = [...EXPORT_FIELDS]
}

function clearExportFields(): void {
    selectedExportFields.value = []
}

function toggleExportField(field: ProjectExportField): void {
    const exists = selectedExportFields.value.includes(field)
    if (exists) {
        selectedExportFields.value = selectedExportFields.value.filter((item) => item !== field)
        return
    }
    selectedExportFields.value = [...selectedExportFields.value, field]
}

async function exportProjectBundle(): Promise<void> {
    if (selectedExportFields.value.length === 0) {
        notify.push(t('projectDetail.chooseExportField'), 'warning')
        return
    }
    exporting.value = true
    try {
        const blob = await api.exportProject(props.projectId, {
            fields: selectedExportFields.value,
            citations_mode: exportCitationsMode.value,
        })
        const filename = `project_${props.projectId}_export.zip`
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
        notify.push(t('projectDetail.exportReady'), 'success')
    } catch (error) {
        notify.push(error instanceof Error ? error.message : t('errors.exportProject'), 'error', 3600)
    } finally {
        exporting.value = false
    }
}
</script>

<template>
    <details
        class="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary
            class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span class="inline-flex items-center gap-2">
                <FileJson class="h-4 w-4" />
                <span>
                    {{ t('projectDetail.exportOptions', { count: selectedExportFields.length }) }}
                </span>
            </span>
            <ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div class="space-y-4 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <div class="flex flex-wrap items-center gap-2">
                <AppButton size="xs" tone="sky" :disabled="exporting" @click="exportProjectBundle">
                    <Download class="h-4 w-4" />
                    <span>{{ exporting ? t('actions.exporting') : t('actions.export') }}</span>
                </AppButton>
                <AppButton size="xs" variant="outline" @click="selectAllExportFields">
                    <CheckSquare class="h-4 w-4" />
                    <span>{{ t('actions.selectAll') }}</span>
                </AppButton>
                <AppButton size="xs" variant="outline" @click="clearExportFields">
                    <X class="h-4 w-4" />
                    <span>{{ t('actions.clear') }}</span>
                </AppButton>
                <div class="ml-2 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span>{{ t('projectDetail.citations') }}:</span>
                    <label class="inline-flex items-center gap-1">
                        <input v-model="exportCitationsMode" type="radio" value="keep" />
                        <span>{{ t('projectDetail.keepCitations') }}</span>
                    </label>
                    <label class="inline-flex items-center gap-1">
                        <input v-model="exportCitationsMode" type="radio" value="strip" />
                        <span>{{ t('projectDetail.stripCitations') }}</span>
                    </label>
                </div>
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label v-for="field in EXPORT_FIELDS" :key="field"
                    class="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700">
                    <input type="checkbox" :checked="selectedExportFields.includes(field)"
                        @change="toggleExportField(field)" />
                    <span class="font-mono">{{ t(`projectDetail.exportFields.${field}`) }}</span>
                </label>
            </div>
        </div>
    </details>
</template>