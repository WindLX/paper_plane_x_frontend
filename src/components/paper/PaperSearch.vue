<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'

const projectId = defineModel<string>('projectId', { default: '' })
const paperId = defineModel<string>('paperId', { default: '' })
const queryExpr = defineModel<string>('queryExpr', { default: '' })

defineEmits<{
    search: []
    clear: []
}>()

const { t } = useI18n()
</script>

<template>
    <section class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
            <Search class="h-4 w-4" />
            <span>{{ t('librarian.search.title') }}</span>
        </div>
        <div class="space-y-3">
            <div>
                <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{
                    t('librarian.search.projectScope') }}</label>
                <input v-model="projectId" :placeholder="t('librarian.search.projectScopePlaceholder')"
                    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            </div>
            <div>
                <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.search.paperId')
                    }}</label>
                <input v-model="paperId" :placeholder="t('librarian.search.paperIdPlaceholder')"
                    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            </div>
            <div>
                <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.search.queryExpr')
                    }}</label>
                <textarea v-model="queryExpr" rows="5" :placeholder="t('librarian.search.queryExprPlaceholder')"
                    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            </div>
            <div class="flex items-center justify-between gap-2">
                <AppButton tone="sky" variant="solid" size="md" class="flex-1" @click="$emit('search')">
                    <Search class="h-4 w-4" />
                    <span>{{ t('librarian.search.run') }}</span>
                </AppButton>
                <AppButton tone="sky" size="md" class="flex-1" @click="$emit('clear')">
                    <X class="h-4 w-4" />
                    <span>{{ t('librarian.search.clear') }}</span>
                </AppButton>
            </div>
        </div>
    </section>
</template>