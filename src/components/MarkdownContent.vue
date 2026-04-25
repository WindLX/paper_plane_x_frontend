<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  markdown: string
}>()

const md = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
})

const html = computed(() => DOMPurify.sanitize(md.render(props.markdown || '')))
</script>

<template>
  <div class="markdown-content prose prose-sm max-w-none wrap-break-word dark:prose-invert" v-html="html" />
</template>

<style scoped>
.markdown-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.markdown-content :deep(pre),
.markdown-content :deep(code) {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
