<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Download, ExternalLink, LoaderCircle, PanelLeftClose, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{
  paperId: string
  paperTitle?: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const checking = ref(false)
const ready = ref(false)
const frameLoaded = ref(false)
const error = ref('')
let controller: AbortController | null = null

const inlineUrl = computed(() => api.getPaperPdfUrl(props.paperId))
const downloadUrl = computed(() => api.getPaperPdfUrl(props.paperId, true))
const frameTitle = computed(() =>
  t('paper.pdf.frameTitle', { title: props.paperTitle || props.paperId }),
)

async function loadPdf(): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  checking.value = true
  ready.value = false
  frameLoaded.value = false
  error.value = ''
  try {
    await api.checkPaperPdf(props.paperId, controller.signal)
    ready.value = true
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    checking.value = false
  }
}

watch(() => props.paperId, loadPdf, { immediate: true })

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="bg-ppx-bg flex h-full min-w-0 flex-1 flex-col overflow-hidden">
    <header class="workspace-divider bg-ppx-bg-elevated flex items-center gap-3 border-b px-4 py-3">
      <div class="min-w-0 flex-1">
        <h2 class="workspace-heading-card truncate">{{ t('paper.pdf.title') }}</h2>
        <p class="text-ppx-text-muted truncate text-xs">{{ paperTitle || paperId }}</p>
      </div>
      <a
        :href="inlineUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="border-ppx-border text-ppx-text-soft hover:bg-ppx-bg-subtle hover:text-ppx-text focus-visible:ring-ppx-accent-soft rounded-ppx-interactive inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border transition-colors focus-visible:ring-3 focus-visible:outline-none"
        :aria-label="t('paper.pdf.openNewTab')"
        :title="t('paper.pdf.openNewTab')"
      >
        <ExternalLink class="h-4 w-4" />
      </a>
      <a
        :href="downloadUrl"
        class="border-ppx-border text-ppx-text-soft hover:bg-ppx-bg-subtle hover:text-ppx-text focus-visible:ring-ppx-accent-soft rounded-ppx-interactive inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border transition-colors focus-visible:ring-3 focus-visible:outline-none"
        :aria-label="t('paper.pdf.download')"
        :title="t('paper.pdf.download')"
      >
        <Download class="h-4 w-4" />
      </a>
      <button
        type="button"
        class="workspace-icon-button"
        :aria-label="t('paper.pdf.close')"
        :title="t('paper.pdf.close')"
        @click="emit('close')"
      >
        <PanelLeftClose class="h-4 w-4" />
      </button>
    </header>

    <div class="relative min-h-0 flex-1 overflow-hidden">
      <div
        v-if="checking || (ready && !frameLoaded)"
        class="bg-ppx-bg absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
        role="status"
      >
        <LoaderCircle class="text-ppx-accent h-8 w-8 animate-spin" />
        <span class="text-ppx-text-muted text-sm">{{ t('paper.pdf.loading') }}</span>
      </div>

      <div v-if="error" class="flex h-full items-center justify-center p-6" role="alert">
        <div class="workspace-panel max-w-sm space-y-3 p-5 text-center">
          <h3 class="workspace-heading-card">{{ t('paper.pdf.loadFailed') }}</h3>
          <p class="workspace-body wrap-break-word">{{ error }}</p>
          <AppButton size="sm" variant="outline" tone="rose" @click="loadPdf">
            <RefreshCw class="h-4 w-4" />
            <span>{{ t('paper.pdf.retry') }}</span>
          </AppButton>
        </div>
      </div>

      <iframe
        v-if="ready"
        :src="inlineUrl"
        :title="frameTitle"
        class="h-full w-full border-0"
        @load="frameLoaded = true"
      />
    </div>
  </section>
</template>
