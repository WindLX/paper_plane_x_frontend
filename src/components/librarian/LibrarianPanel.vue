<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
    BarChart3,
    Search,
    Waypoints,
    Workflow,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import PagerBar from '../PagerBar.vue'
import PaperListTable from '../paper/PaperListTable.vue'
import PaperDetailPanel from '../paper/PaperDetailPanel.vue'
import GlobalFinderTab from './GlobalFinderTab.vue'
import MatrixTab from './MatrixTab.vue'
import ProjectionTab from './ProjectionTab.vue'
import SearchTab from './SearchTab.vue'
import type { LibrarianHelpContent } from '../../constants/librarianHelp'
import { useLibrarianStore } from '../../stores/librarian'
import { useNotify } from '../../composables/notify'

const props = defineProps<{
    projectId: string
    librarianHelp: LibrarianHelpContent
}>()

const notify = useNotify()
const { t } = useI18n()
const lastErrorNotified = ref<string | null>(null)

const librarianStore = useLibrarianStore()
const { activeTab } = storeToRefs(librarianStore)

const unlinkingPaperId = ref<string | null>(null)
const linkingPaperId = ref<string | null>(null)

const librarianTabItems = computed(() => [
    { key: 'globalFinder' as const, label: t('librarian.tabs.globalFinder'), icon: BarChart3 },
    { key: 'search' as const, label: t('librarian.tabs.search'), icon: Search },
    { key: 'projection' as const, label: t('librarian.tabs.projection'), icon: Waypoints },
    { key: 'matrix' as const, label: t('librarian.tabs.matrix'), icon: Workflow },
])

onMounted(async () => {
    if (librarianStore.searchProjectId !== props.projectId) {
        librarianStore.searchProjectId = props.projectId
        librarianStore.searchPaperId = ''
        librarianStore.searchQueryExpr = ''
    }
    await librarianStore.fetchPapers({ offset: 0, limit: 20 })
})


// Auto-select first paper when list changes
watch(
    () => librarianStore.papers,
    (items) => {
        if (items.length === 0) {
            librarianStore.selectedPaperId = null
            return
        }
        const exists = items.some((p) => p.paper_id === librarianStore.selectedPaperId)
        if (!exists) {
            librarianStore.selectedPaperId = items[0].paper_id
        }
    },
    { immediate: true }
)

watch(
    () => librarianStore.error,
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

const selectedPaper = computed(() => {
    if (!librarianStore.selectedPaperId) return null
    return librarianStore.papers.find((p) => p.paper_id === librarianStore.selectedPaperId) ?? null
})

async function unlinkPaper(paperId: string): Promise<void> {
    unlinkingPaperId.value = paperId
    try {
        await librarianStore.unlinkProjectPaper(paperId)
    } finally {
        unlinkingPaperId.value = null
    }
}

async function linkPaper(paperId: string): Promise<void> {
    linkingPaperId.value = paperId
    try {
        await librarianStore.linkProjectPaper(paperId)
    } finally {
        linkingPaperId.value = null
    }
}
</script>

<template>
    <section class="space-y-3">
        <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span>{{ t('projectDetail.papers') }}</span>
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('tasks.legend') }}</p>
        </div>

        <div
            class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            <button v-for="tab in librarianTabItems" :key="tab.key" type="button"
                class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
                :class="activeTab === tab.key ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300'"
                @click="librarianStore.setActiveTab(tab.key)">
                <component :is="tab.icon" class="h-4 w-4" />
                <span>{{ tab.label }}</span>
            </button>
        </div>

        <GlobalFinderTab v-if="activeTab === 'globalFinder'" :embedded-project-id="projectId"
            :librarian-help="librarianHelp" />
        <SearchTab v-else-if="activeTab === 'search'" :librarian-help="librarianHelp" />
        <ProjectionTab v-else-if="activeTab === 'projection'" :librarian-help="librarianHelp" />
        <MatrixTab v-else-if="activeTab === 'matrix'" :librarian-help="librarianHelp" />

        <template v-if="activeTab !== 'globalFinder'">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <PaperListTable :papers="librarianStore.papers" :offset="librarianStore.offset"
                    v-model:selected-paper-id="librarianStore.selectedPaperId" :sortBy="librarianStore.sortBy"
                    :sort-order="librarianStore.sortOrder" @sort="librarianStore.toggleSort" />
                <PaperDetailPanel :paper="selectedPaper" :project-id="projectId" :unlinking-paper-id="unlinkingPaperId"
                    :linking-paper-id="linkingPaperId" @unlink="unlinkPaper" @link="linkPaper" />
            </div>

            <PagerBar :current-page="librarianStore.currentPage" :total-pages="librarianStore.totalPages"
                :total-count="librarianStore.total" :rows-per-page="librarianStore.limit"
                @prev-page="librarianStore.prevPage()" @next-page="librarianStore.nextPage()"
                @set-page="librarianStore.setPage" @set-limit="librarianStore.setLimit" />
        </template>
    </section>
</template>
