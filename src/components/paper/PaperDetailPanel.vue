<script setup lang="ts">
import { computed } from 'vue'
import {
    Eye,
    ExternalLink,
    Link2,
    Unlink2,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import type { PaperResponse } from '../../types/api'
import { formatDateTime } from '../../utils/format'
import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'
import JsonPanel from '../JsonPanel.vue'

const props = defineProps<{
    paper: PaperResponse | null
    projectId?: string
    unlinkingPaperId?: string | null
    linkingPaperId?: string | null
}>()

const emit = defineEmits<{
    unlink: [paperId: string]
    link: [paperId: string]
}>()

const isInProject = computed<boolean>(() => {
    if (!props.projectId || !props.paper) return false
    return props.paper.project_ids.includes(props.projectId)
})

const { t } = useI18n()

const customMeta = computed<Record<string, unknown> | null>(() => {
    const raw = props.paper?.custom_meta
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'object' && parsed !== null) {
            return parsed as Record<string, unknown>
        }
        return null
    } catch {
        return null
    }
})

const zoteroKey = computed<string | null>(() => {
    const value = customMeta.value?.zotero_key
    if (typeof value !== 'string' || value.trim().length === 0) return null
    return value.trim()
})

const zoteroUrl = computed<string | null>(() => {
    if (!zoteroKey.value) return null
    return `zotero://select/library/items/${zoteroKey.value}`
})
</script>

<template>
    <aside
        class="self-start rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
        <template v-if="paper">
            <header class="mb-4 flex flex-col space-y-2">
                <div class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Eye class="h-3.5 w-3.5" />
                    <span>{{ t('projectDetail.selectedPaper') }}</span>
                </div>
                <div class="flex justify-between gap-2">
                    <CopyableText :text="paper.paper_id" mono />
                    <div class="flex items-center gap-2">
                        <a v-if="zoteroUrl" :href="zoteroUrl"
                            class="inline-flex items-center justify-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-slate-800">
                            <ExternalLink class="h-3.5 w-3.5" />
                            <span>Zotero</span>
                        </a>
                        <AppButton v-if="isInProject" tone="rose" size="xs"
                            :disabled="unlinkingPaperId === paper.paper_id" @click="emit('unlink', paper.paper_id)">
                            <Unlink2 class="h-3.5 w-3.5" />
                            <span>{{ t('actions.unlink') }}</span>
                        </AppButton>
                        <AppButton v-else-if="projectId" tone="emerald" size="xs"
                            :disabled="linkingPaperId === paper.paper_id" @click="emit('link', paper.paper_id)">
                            <Link2 class="h-3.5 w-3.5" />
                            <span>{{ t('actions.link') }}</span>
                        </AppButton>
                    </div>
                </div>
                <div class="warp-break-word text-sm font-bold text-slate-700 dark:text-slate-200">{{ paper.title ?? '-'
                }}</div>
            </header>

            <div class="mb-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.created')
                }}:</span>
                    {{ formatDateTime(paper.created_at) }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.updated')
                }}:</span>
                    {{ formatDateTime(paper.updated_at) }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.authors')
                }}:</span> {{ paper.authors.join(', ') || '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.year')
                }}:</span> {{ paper.year ?? '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                    t('projectDetail.labels.publication')
                        }}:</span> {{ paper.publication ?? '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.doi')
                }}:</span> {{ paper.doi ?? '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                    t('projectDetail.labels.projectIds')
                        }}</span>: {{ paper.project_ids.join(', ') || '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                    t('projectDetail.labels.customMeta')
                        }}:</span> {{ paper.custom_meta ?? '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{
                    t('projectDetail.labels.rawPdfPath')
                        }}:</span> {{ paper.raw_pdf_path ?? '-' }}</div>
                <div><span class="font-semibold text-slate-700 dark:text-slate-200">{{ t('projectDetail.labels.sha256')
                }}:</span> {{ paper.raw_pdf_sha256 ?? '-' }}</div>
            </div>

            <JsonPanel :title="t('projectDetail.rawPaperJson')" :value="paper" max-height="36vh" defaultOpen />
        </template>
        <div v-else class="text-sm text-slate-500 dark:text-slate-400">{{ t('projectDetail.noPaperSelected') }}</div>
    </aside>
</template>
