<script setup lang="ts">
import { computed } from 'vue'
import { Waypoints } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { api } from '../../api/client'
import type { LibrarianHelpContent } from '../../constants/librarianHelp'
import { useNotify } from '../../composables/notify'
import { useLibrarianStore } from '../../stores/librarian'
import { isPlainObject, renderValueInline } from '../../utils/renderValueInline'
import AppButton from '../AppButton.vue'
import JsonPanel from '../JsonPanel.vue'
import MarkdownContent from '../MarkdownContent.vue'

const props = defineProps<{
  librarianHelp: LibrarianHelpContent
}>()

const { t } = useI18n()
const notify = useNotify()
const store = useLibrarianStore()
const { projectionPaperId, projectionFieldPath, projectionResult } = storeToRefs(store)

const projectionRenderedText = computed(() => {
  const value = projectionResult.value?.value
  if (typeof value === 'string') return value
  if (isPlainObject(value) && typeof value.text === 'string') return value.text
  return null
})

const projectionPrimitiveList = computed(() => {
  const value = projectionResult.value?.value
  if (!Array.isArray(value)) return null
  if (!value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
    return null
  }
  return value.map((item) => String(item))
})

async function runProjection(): Promise<void> {
  try {
    projectionResult.value = await api.librarianProjection(
      projectionPaperId.value.trim(),
      projectionFieldPath.value.trim(),
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
          <Waypoints class="h-4 w-4" />
          <span>{{ t('librarian.projection.title') }}</span>
        </div>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.projection.paperId')
              }}</label>
            <input v-model="projectionPaperId"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
          </div>
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('librarian.projection.fieldPath')
              }}</label>
            <input v-model="projectionFieldPath"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
          </div>
          <div class="flex items-center justify-between">
            <AppButton tone="sky" variant="solid" size="md" class="flex-1" @click="runProjection">
              <Waypoints class="h-4 w-4" />
              <span>{{ t('librarian.projection.run') }}</span>
            </AppButton>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 text-sm font-semibold">{{ t('librarian.help.supportedFields') }}</div>
          <JsonPanel :title="t('librarian.help.supportedFields')" :value="props.librarianHelp.projectionSchema" />
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 text-sm font-semibold">{{ t('librarian.help.syntax') }}</div>
          <div class="space-y-2">
            <div v-for="field in props.librarianHelp.projectionExamples" :key="field"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950">
              {{ field }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-3 text-sm font-semibold">{{ t('librarian.projection.rendered') }}</div>
      <div v-if="!projectionResult"
        class="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        {{ t('librarian.projection.empty') }}
      </div>
      <div v-else class="space-y-4">
        <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
          <template v-if="projectionRenderedText">
            <MarkdownContent :markdown="projectionRenderedText" />
          </template>
          <template v-else-if="projectionPrimitiveList">
            <ul class="space-y-1 text-sm">
              <li v-for="item in projectionPrimitiveList" :key="item">{{ item }}</li>
            </ul>
          </template>
          <template v-else>
            <pre
              class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ renderValueInline(projectionResult.value) }}</pre>
          </template>
        </div>
        <JsonPanel :title="t('librarian.help.rawJson')" :value="projectionResult" />
      </div>
    </section>
  </div>
</template>
