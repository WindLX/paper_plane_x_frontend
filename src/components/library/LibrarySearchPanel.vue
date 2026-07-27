<script setup lang="ts">
import { Braces, CircleHelp, Search, Sparkles, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import JsonPanel from '@/components/JsonPanel.vue'
import type { LibrarianGuideResponse, LibrarySearchInputState } from '@/types/api'

const searchState = defineModel<LibrarySearchInputState>('searchState', { required: true })
const advancedOpen = defineModel<boolean>('advancedOpen', { required: true })

const props = defineProps<{
  aiPolishing?: boolean
  hideProjectScope?: boolean
  guide?: LibrarianGuideResponse | null
  guideLoading?: boolean
}>()

const emit = defineEmits<{
  runSearch: []
  clearSearch: []
  aiPolish: []
}>()

const { t } = useI18n()
const syntaxHelpOpen = ref(false)
const syntaxHelpId = 'library-query-syntax-help'

function applyExample(example: string): void {
  searchState.value.queryExpr = example
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="relative min-w-0 flex-1">
        <Search
          class="text-ppx-text-muted pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
        />
        <input
          v-model="searchState.rawInput"
          :placeholder="t('library.search.mainPlaceholder')"
          :aria-label="t('library.search.simpleLabel')"
          class="workspace-input w-full py-3 pr-4 pl-11"
          @keydown.enter.prevent="emit('runSearch')"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton
          tone="emerald"
          variant="soft"
          size="md"
          :loading="props.aiPolishing"
          :disabled="!searchState.rawInput.trim()"
          @click="emit('aiPolish')"
        >
          <Sparkles class="h-4 w-4" />
          <span>{{ t('library.search.aiPolish') }}</span>
        </AppButton>
        <AppButton tone="sky" variant="solid" size="md" @click="emit('runSearch')">
          <Search class="h-4 w-4" />
          <span>{{ t('library.search.run') }}</span>
        </AppButton>
        <AppButton size="md" variant="outline" @click="advancedOpen = !advancedOpen">
          <Braces class="h-4 w-4" />
          <span>{{
            advancedOpen ? t('library.search.hideAdvanced') : t('library.search.advanced')
          }}</span>
        </AppButton>
        <AppButton size="md" variant="outline" @click="emit('clearSearch')">
          <X class="h-4 w-4" />
          <span>{{ t('library.search.clear') }}</span>
        </AppButton>
      </div>
    </div>

    <Transition name="section-collapse">
      <div v-if="advancedOpen" class="border-ppx-border mt-3 grid gap-4 border-t pt-3">
        <div class="grid gap-3 md:grid-cols-2">
          <div class="md:col-span-2">
            <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label for="library-query-expression" class="workspace-label">
                {{ t('library.search.queryExpr') }}
              </label>
              <button
                type="button"
                class="text-ppx-text-soft hover:bg-ppx-bg-subtle hover:text-ppx-text focus-visible:ring-ppx-info/45 rounded-ppx-interactive inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                :aria-expanded="syntaxHelpOpen"
                :aria-controls="syntaxHelpId"
                @click="syntaxHelpOpen = !syntaxHelpOpen"
              >
                <CircleHelp class="h-3.5 w-3.5" />
                <span>{{ t('library.search.syntaxHelp') }}</span>
              </button>
            </div>
            <textarea
              id="library-query-expression"
              v-model="searchState.queryExpr"
              rows="5"
              :placeholder="t('library.search.queryExprPlaceholder')"
              class="workspace-textarea"
            />
            <Transition name="section-collapse">
              <div
                v-if="syntaxHelpOpen"
                :id="syntaxHelpId"
                class="border-ppx-border bg-ppx-bg-subtle/55 mt-3 space-y-3 rounded-lg border p-3"
              >
                <div>
                  <h4 class="text-ppx-text text-sm font-semibold">
                    {{ t('library.search.syntaxTitle') }}
                  </h4>
                  <ul class="text-ppx-text-soft mt-1.5 grid gap-1 text-xs md:grid-cols-2">
                    <li><code>(field CONTAINS value)</code></li>
                    <li><code>(meta.year BETWEEN [2020, 2025])</code></li>
                    <li>{{ t('library.search.syntaxBoolean') }}</li>
                    <li>{{ t('library.search.syntaxQuotes') }}</li>
                  </ul>
                </div>

                <div v-if="props.guide?.query_examples?.length">
                  <div class="text-ppx-text mb-1.5 text-xs font-semibold">
                    {{ t('library.search.examples') }}
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="example in props.guide.query_examples"
                      :key="example"
                      type="button"
                      class="border-ppx-border bg-ppx-bg-surface text-ppx-text-soft hover:border-ppx-info/50 hover:text-ppx-text focus-visible:ring-ppx-info/45 max-w-full cursor-pointer rounded-md border px-2 py-1 text-left font-mono text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      @click="applyExample(example)"
                    >
                      {{ example }}
                    </button>
                  </div>
                </div>

                <div v-if="props.guideLoading" class="text-ppx-text-muted text-xs">
                  {{ t('library.search.guideLoading') }}
                </div>
                <JsonPanel
                  v-else-if="props.guide"
                  :title="t('library.search.availableFields')"
                  :value="props.guide.query_schema"
                  :default-open="false"
                  max-height="18rem"
                />
              </div>
            </Transition>
          </div>
          <div v-if="!props.hideProjectScope">
            <label for="library-project-scope" class="workspace-label mb-1">
              {{ t('library.search.projectScope') }}
            </label>
            <input
              id="library-project-scope"
              v-model="searchState.projectScope"
              :placeholder="t('library.search.projectScopePlaceholder')"
              class="workspace-input"
            />
          </div>
          <div>
            <label for="library-paper-id" class="workspace-label mb-1">
              {{ t('library.search.paperId') }}
            </label>
            <input
              id="library-paper-id"
              v-model="searchState.paperId"
              :placeholder="t('library.search.paperIdPlaceholder')"
              class="workspace-input"
            />
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>
