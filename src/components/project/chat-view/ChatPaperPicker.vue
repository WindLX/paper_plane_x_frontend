<script setup lang="ts">
import { Braces, FileText, LoaderCircle, Search, Sparkles, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppButton from '@/components/AppButton.vue'
import AppModalShell from '@/components/AppModalShell.vue'
import VirtualScrollList from '@/components/VirtualScrollList.vue'
import { useNotify } from '@/composables/useNotify'
import type { PaperResponse } from '@/types/api'

const props = defineProps<{
  open: boolean
  projectId?: string
  selectedPaperIds: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'toggle-paper': [paper: PaperResponse]
}>()

const { t } = useI18n()
const notify = useNotify()

// --- Search State ---
const rawInput = ref('')
const queryExpr = ref('')
const paperId = ref('')
const advancedOpen = ref(false)

// --- Pagination State ---
const LIMIT = 20
const offset = ref(0)
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const results = ref<PaperResponse[]>([])

const hasMore = computed(() => results.value.length < total.value)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      clearSearch()
      void runSearch()
    }
  },
)

function clearSearch(): void {
  rawInput.value = ''
  queryExpr.value = ''
  paperId.value = ''
  advancedOpen.value = false
  results.value = []
  total.value = 0
  offset.value = 0
}

function buildPayload(extraOffset = 0) {
  const base = advancedOpen.value
    ? {
        query_expr: queryExpr.value.trim() || undefined,
        paper_id: paperId.value.trim() || undefined,
      }
    : { query_expr: rawInput.value.trim() || undefined }
  return {
    ...base,
    limit: LIMIT,
    offset: offset.value + extraOffset,
  }
}

async function runSearch(reset = true): Promise<void> {
  if (!props.projectId) return
  if (reset) {
    offset.value = 0
    results.value = []
  }
  loading.value = true
  try {
    const payload = buildPayload()
    const searchRes = await api.searchProject(props.projectId, payload)
    total.value = searchRes.total
    if (searchRes.paper_ids.length > 0) {
      const batchRes = await api.batchGetPapers(searchRes.paper_ids, 0, searchRes.paper_ids.length)
      if (reset) {
        results.value = batchRes.items
      } else {
        results.value.push(...batchRes.items)
      }
    } else if (reset) {
      results.value = []
    }
  } catch {
    if (reset) results.value = []
  } finally {
    loading.value = false
  }
}

async function loadMore(): Promise<void> {
  if (!hasMore.value || loadingMore.value || !props.projectId) return
  loadingMore.value = true
  offset.value += LIMIT
  try {
    const payload = buildPayload()
    const searchRes = await api.searchProject(props.projectId, payload)
    total.value = searchRes.total
    if (searchRes.paper_ids.length > 0) {
      const batchRes = await api.batchGetPapers(searchRes.paper_ids, 0, searchRes.paper_ids.length)
      results.value.push(...batchRes.items)
    }
  } catch {
    // ignore
  } finally {
    loadingMore.value = false
  }
}

function handleReachBottom(): void {
  if (loading.value || loadingMore.value || !hasMore.value) return
  void loadMore()
}

// --- AI Polish ---
const aiPolishing = ref(false)

async function aiPolish(): Promise<void> {
  const query = rawInput.value.trim()
  if (!query || !props.projectId) return
  aiPolishing.value = true
  try {
    const result = await api.librarianQueryBuilder({
      query,
      project_context: props.projectId,
    })
    queryExpr.value = result.query_expr
    advancedOpen.value = true
    notify.push(result.explanation, 'info', 4000)
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  } finally {
    aiPolishing.value = false
  }
}

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return '-'
  const joined = authors.join(', ')
  return joined.length > 40 ? joined.slice(0, 40) + '…' : joined
}

function onTogglePaper(paper: PaperResponse): void {
  emit('toggle-paper', paper)
}

function onClose(): void {
  emit('update:open', false)
}
</script>

<template>
  <AppModalShell
    :open="open"
    :title="t('projects.chatView.attachPaper')"
    width-class="max-w-3xl"
    @close="onClose"
  >
    <div class="space-y-3">
      <!-- Search Toolbar -->
      <div class="workspace-panel p-3">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <Search class="workspace-muted h-4 w-4 shrink-0" />
            <input
              v-model="rawInput"
              :placeholder="t('library.search.mainPlaceholder')"
              class="text-ppx-text min-w-0 flex-1 bg-transparent text-sm outline-none"
              @keydown.enter.prevent="runSearch()"
            />
            <button v-if="loading" type="button" class="workspace-icon-button h-6 w-6">
              <LoaderCircle class="h-4 w-4 animate-spin" />
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton
              tone="emerald"
              variant="soft"
              size="xs"
              :loading="aiPolishing"
              :disabled="!rawInput.trim()"
              @click="aiPolish"
            >
              <Sparkles class="h-3.5 w-3.5" />
              <span>{{ t('library.search.aiPolish') }}</span>
            </AppButton>
            <AppButton tone="sky" variant="solid" size="xs" @click="runSearch()">
              <Search class="h-3.5 w-3.5" />
              <span>{{ t('library.search.run') }}</span>
            </AppButton>
            <AppButton size="xs" variant="outline" @click="advancedOpen = !advancedOpen">
              <Braces class="h-3.5 w-3.5" />
              <span>{{
                advancedOpen ? t('library.search.hideAdvanced') : t('library.search.advanced')
              }}</span>
            </AppButton>
            <AppButton size="xs" variant="outline" @click="clearSearch">
              <X class="h-3.5 w-3.5" />
              <span>{{ t('library.search.clear') }}</span>
            </AppButton>
          </div>

          <!-- Advanced Panel -->
          <Transition name="section-collapse">
            <div v-if="advancedOpen" class="border-ppx-border grid gap-3 border-t pt-3">
              <div>
                <label class="workspace-label mb-1">{{ t('library.search.queryExpr') }}</label>
                <textarea
                  v-model="queryExpr"
                  rows="3"
                  :placeholder="t('library.search.queryExprPlaceholder')"
                  class="workspace-textarea w-full text-sm"
                />
              </div>
              <div>
                <label class="workspace-label mb-1">{{ t('library.search.paperId') }}</label>
                <input
                  v-model="paperId"
                  :placeholder="t('library.search.paperIdPlaceholder')"
                  class="workspace-input w-full text-sm"
                />
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Results -->
      <VirtualScrollList
        v-if="results.length > 0"
        :items="results"
        :window-size="24"
        :step-size="8"
        key-field="paper_id"
        class="max-h-[60vh] space-y-1 overflow-y-auto"
        @reach-bottom="handleReachBottom"
      >
        <template #default="{ item: paper }">
          <button
            type="button"
            class="duration-ppx-fast flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
            :class="
              selectedPaperIds.includes(paper.paper_id)
                ? 'bg-ppx-accent-soft/40 text-ppx-accent border-ppx-accent border'
                : 'text-ppx-text hover:bg-ppx-bg-subtle border border-transparent'
            "
            @click="onTogglePaper(paper)"
          >
            <FileText
              class="mt-0.5 h-4 w-4 shrink-0"
              :class="
                selectedPaperIds.includes(paper.paper_id)
                  ? 'text-ppx-accent'
                  : 'text-ppx-text-muted'
              "
            />
            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="truncate font-medium">{{ paper.title || paper.paper_id }}</div>
              <div class="text-ppx-text-muted text-xs">
                <span class="truncate">{{ formatAuthors(paper.authors) }}</span>
                <span v-if="paper.publication"> · {{ paper.publication }}</span>
                <span v-if="paper.year"> · {{ paper.year }}</span>
              </div>
              <div class="text-ppx-text-muted text-xs">
                {{ paper.paper_id }} · {{ paper.created_at.slice(0, 10) }}
              </div>
            </div>
          </button>
        </template>

        <template #below>
          <div v-if="loadingMore" class="flex justify-center py-3">
            <LoaderCircle class="text-ppx-text-muted h-5 w-5 animate-spin" />
          </div>
        </template>
      </VirtualScrollList>

      <div v-else-if="!loading" class="workspace-body px-3 py-6 text-center text-sm">
        {{ t('library.search.searchResultEmpty') }}
      </div>
    </div>
  </AppModalShell>
</template>
