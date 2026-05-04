<script setup lang="ts">
import type { SectionCard } from '@/composables/usePaperHelpers'
import MarkdownContent from '../MarkdownContent.vue'
import CitationsBlock from './CitationsBlock.vue'

const props = defineProps<{
  cards: SectionCard[]
  emptyText?: string
}>()
</script>

<template>
  <div v-if="props.cards.length" class="space-y-2">
    <article
      v-for="(item, index) in props.cards"
      :key="`section-card-${index}`"
      class="bg-ppx-bg-elevated/60 rounded-md p-3"
    >
      <div class="text-ppx-text text-sm font-semibold">{{ item.title }}</div>
      <div class="mt-2 space-y-2">
        <section
          v-for="(field, fieldIndex) in item.fields"
          :key="`section-card-${index}-${fieldIndex}`"
          class="bg-ppx-bg-elevated rounded-md p-2.5"
        >
          <div class="workspace-label mb-0">{{ field.label }}</div>
          <MarkdownContent class="mt-1.5" :markdown="field.text" />
          <CitationsBlock v-if="field.citations.length" :citations="field.citations" />
        </section>
      </div>
    </article>
  </div>
  <div v-else class="workspace-body">{{ props.emptyText ?? '-' }}</div>
</template>
