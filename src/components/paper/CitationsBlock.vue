<script setup lang="ts">
import { ChevronDown, Quote } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import type { Citation } from '@/composables/usePaperHelpers'

const props = defineProps<{
  citations: Citation[]
  panelClass?: string
}>()

const { t } = useI18n()
</script>

<template>
  <details
    v-if="props.citations.length > 0"
    class="group text-ppx-text-soft border-ppx-border mt-2 rounded-md border p-2"
    :class="props.panelClass"
  >
    <summary
      class="text-ppx-text-soft flex cursor-pointer list-none items-center justify-between text-xs"
    >
      <span class="inline-flex items-center gap-1.5">
        <Quote class="text-ppx-text-soft h-3.5 w-3.5" />
        {{ t('paper.sectionCitations') }} {{ props.citations.length }}
      </span>
      <ChevronDown
        class="text-ppx-text-soft duration-ppx-fast h-3.5 w-3.5 transition-transform group-open:rotate-180"
      />
    </summary>
    <div class="mt-2 space-y-2">
      <article
        v-for="(citation, index) in props.citations"
        :key="`${citation.sourceHeader}-${index}`"
        class="text-ppx-text-soft border-ppx-border rounded-md border px-2.5 py-2"
      >
        <p class="text-ppx-text-soft text-xs">{{ citation.quote || '-' }}</p>
        <p class="text-ppx-text-soft mt-1 text-xs">
          {{ citation.sourceHeader || '-' }}
        </p>
      </article>
    </div>
  </details>
</template>
