<script setup lang="ts">
import { computed } from 'vue'
import { Workflow } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { api } from '../../api/client'
import type { LibrarianHelpContent } from '../../constants/librarianHelp'
import { useNotify } from '../../composables/notify'
import { useLibrarianStore } from '../../stores/librarian'
import { renderValueInline } from '../../utils/renderValueInline'
import AppButton from '../AppButton.vue'
import JsonPanel from '../JsonPanel.vue'

const props = defineProps<{
  librarianHelp: LibrarianHelpContent
}>()

const { t } = useI18n()
const notify = useNotify()
const store = useLibrarianStore()
const { matrixPaperIds, matrixFieldPaths, matrixResult } = storeToRefs(store)

const matrixRows = computed(() => {
  if (!matrixResult.value) return []
  return matrixResult.value.paper_ids.map((paperId) => ({
    paperId,
    cells: matrixResult.value?.field_paths.map((fieldPath) => ({
      fieldPath,
      value: matrixResult.value?.items[paperId]?.[fieldPath] ?? null,
    })),
  }))
})

function splitLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

async function runMatrix(): Promise<void> {
  try {
    matrixResult.value = await api.librarianMatrix(
      splitLines(matrixPaperIds.value),
      splitLines(matrixFieldPaths.value),
    )
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
          <Workflow class="h-4 w-4" />
          <span>{{ t('librarian.matrix.title') }}</span>
        </div>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.matrix.paperIds')
              }}</label>
            <textarea v-model="matrixPaperIds" rows="5" :placeholder="t('librarian.matrix.paperIdsPlaceholder')"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
          </div>
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.matrix.fieldPaths')
              }}</label>
            <textarea v-model="matrixFieldPaths" rows="5" :placeholder="t('librarian.matrix.fieldPathsPlaceholder')"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
          </div>
          <div class="flex items-center justify-between">
            <AppButton tone="sky" variant="solid" size="md" class="flex-1" @click="runMatrix">
              <Workflow class="h-4 w-4" />
              <span>{{ t('librarian.matrix.run') }}</span>
            </AppButton>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 text-sm font-semibold">{{ t('librarian.help.supportedFields') }}</div>
          <JsonPanel :title="t('librarian.help.supportedFields')" :value="props.librarianHelp.matrixSchema" />
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 text-sm font-semibold">{{ t('librarian.help.tips') }}</div>
          <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li v-for="tip in props.librarianHelp.matrixTips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-3 text-sm font-semibold">{{ t('librarian.output.matrix') }}</div>
      <div v-if="!matrixResult || matrixRows.length === 0"
        class="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        {{ t('librarian.matrix.empty') }}
      </div>
      <div v-else class="space-y-4">
        <div class="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                <th class="px-3 py-2">paper_id</th>
                <th v-for="fieldPath in matrixResult.field_paths" :key="fieldPath"
                  class="px-3 py-2 font-mono normal-case">{{ fieldPath }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="row in matrixRows" :key="row.paperId">
                <td class="px-3 py-2 align-top">{{ row.paperId }}</td>
                <td v-for="cell in row.cells" :key="`${row.paperId}-${cell.fieldPath}`"
                  class="max-w-72 px-3 py-2 align-top text-xs text-slate-700 dark:text-slate-300">
                  {{ renderValueInline(cell.value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <JsonPanel :title="t('librarian.help.rawJson')" :value="matrixResult" />
      </div>
    </section>
  </div>
</template>
