<script setup lang="ts">
import { Braces, Search, Sparkles, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import type { LibrarySearchInputState } from '@/types/api'

const searchState = defineModel<LibrarySearchInputState>('searchState', { required: true })
const advancedOpen = defineModel<boolean>('advancedOpen', { required: true })

const props = defineProps<{
  aiPolishing?: boolean
}>()

const emit = defineEmits<{
  runSearch: []
  clearSearch: []
  aiPolish: []
}>()

const { t } = useI18n()
</script>

<template>
  <section class="space-y-3">
    <div class="workspace-panel p-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative min-w-0 flex-1">
          <Search
            class="text-ppx-text-muted pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
          />
          <input
            v-model="searchState.rawInput"
            :placeholder="t('library.searchMainPlaceholder')"
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
            <span>{{ t('library.aiPolish') }}</span>
          </AppButton>
          <AppButton tone="sky" variant="solid" size="md" @click="emit('runSearch')">
            <Search class="h-4 w-4" />
            <span>{{ t('library.runSearch') }}</span>
          </AppButton>
          <AppButton size="md" variant="outline" @click="advancedOpen = !advancedOpen">
            <Braces class="h-4 w-4" />
            <span>{{ advancedOpen ? t('library.hideAdvanced') : t('library.advanced') }}</span>
          </AppButton>
          <AppButton size="md" variant="outline" @click="emit('clearSearch')">
            <X class="h-4 w-4" />
            <span>{{ t('library.clearSearch') }}</span>
          </AppButton>
        </div>
      </div>

      <Transition name="section-collapse">
        <div v-if="advancedOpen" class="border-ppx-border mt-3 grid gap-4 border-t pt-3">
          <div class="grid gap-3 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="workspace-label mb-1">
                {{ t('librarian.search.queryExpr') }}
              </label>
              <textarea
                v-model="searchState.queryExpr"
                rows="5"
                :placeholder="t('librarian.search.queryExprPlaceholder')"
                class="workspace-textarea"
              />
            </div>
            <div>
              <label class="workspace-label mb-1">
                {{ t('librarian.search.projectScope') }}
              </label>
              <input
                v-model="searchState.projectScope"
                :placeholder="t('librarian.search.projectScopePlaceholder')"
                class="workspace-input"
              />
            </div>
            <div>
              <label class="workspace-label mb-1">
                {{ t('librarian.search.paperId') }}
              </label>
              <input
                v-model="searchState.paperId"
                :placeholder="t('librarian.search.paperIdPlaceholder')"
                class="workspace-input"
              />
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>
