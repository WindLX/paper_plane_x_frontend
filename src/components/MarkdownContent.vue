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
  <div class="prose prose-sm max-w-none dark:prose-invert" v-html="html" />
</template>
