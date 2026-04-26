<script setup lang="ts">
import { BookOpenText } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import type { LibrarianHelpContent } from '../../constants/librarianHelp'
import { useNotify } from '../../composables/notify'
import { useLibrarianStore } from '../../stores/librarian'
import JsonPanel from '../JsonPanel.vue'
import PaperSearch from '../paper/PaperSearch.vue'

const props = defineProps<{
  librarianHelp: LibrarianHelpContent
  defaultProjectId?: string
}>()

const { t } = useI18n()
const notify = useNotify()
const store = useLibrarianStore()
const {
  searchProjectId,
  searchPaperId,
  searchQueryExpr,
} = storeToRefs(store)

if (props.defaultProjectId) {
  store.searchProjectId = props.defaultProjectId
}

async function runSearch(): Promise<void> {
  try {
    await store.fetchPapers({ offset: 0, limit: 20 });
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  }
}

async function handleClear(): Promise<void> {
  store.clearSearch()
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div class="space-y-2">
        <PaperSearch v-model:project-id="searchProjectId" v-model:paper-id="searchPaperId"
          v-model:query-expr="searchQueryExpr" @search="runSearch()" @clear="handleClear()" />
      </div>

      <section class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
            <BookOpenText class="h-4 w-4" />
            <span>{{ t('librarian.help.supportedFields') }}</span>
          </div>
          <JsonPanel :title="t('librarian.help.supportedFields')" :value="props.librarianHelp.querySchema.query_expr" />
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 text-sm font-semibold">{{ t('librarian.help.syntax') }}</div>
          <div class="space-y-2">
            <div v-for="example in props.librarianHelp.queryExamples" :key="example"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950">
              {{ example }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
