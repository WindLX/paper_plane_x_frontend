<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import texmath from 'markdown-it-texmath'

import 'katex/dist/katex.min.css'

const props = withDefaults(
  defineProps<{
    markdown: string
    enableMath?: boolean
  }>(),
  {
    enableMath: true,
  },
)

const emit = defineEmits<{
  'paper-click': [paperId: string]
}>()

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function preprocessPapers(markdown: string): string {
  return markdown.replace(
    /\[\[(pap-[a-f0-9]{32})(?:\s*\|\s*([^\]\n]+?))?\s*\]\]/g,
    (_match, paperId: string, label: string | undefined) => {
      const displayText = label ? `${paperId} | ${label.trim()}` : paperId
      return `<a href="#paper/${paperId}" class="paper-link">${displayText}</a>`
    },
  )
}

function createMarkdownRenderer(enableMath: boolean): MarkdownIt {
  const md = new MarkdownIt({
    breaks: true,
    html: true,
    linkify: true,
  })

  // Custom fence rule to wrap code blocks with header (language label + copy button)
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const info = token.info.trim() || 'text'
    const lang = info.split(/\s+/g)[0]
    const rawCode = token.content
    const displayCode = escapeHtml(rawCode)

    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-block-lang">${lang}</span>
        <button type="button" class="code-block-copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span class="copy-label">复制</span>
          <span class="copied-label">已复制</span>
        </button>
      </div>
      <pre><code class="language-${lang}">${displayCode}</code></pre>
    </div>`
  }

  if (enableMath) {
    md.use(texmath, {
      engine: katex,
      delimiters: 'dollars',
      katexOptions: {
        throwOnError: false,
        strict: 'ignore',
      },
    })
  }

  return md
}

const html = computed(() => {
  const renderer = createMarkdownRenderer(props.enableMath)
  const raw = preprocessPapers(props.markdown || '')
  return DOMPurify.sanitize(renderer.render(raw), {
    ALLOWED_TAGS: [
      'div',
      'span',
      'p',
      'br',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'del',
      'a',
      'img',
      'blockquote',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'pre',
      'code',
      'details',
      'summary',
      'button',
      'svg',
      'rect',
      'path',
      'math',
      'mrow',
      'mi',
      'mo',
      'mn',
      'msub',
      'msup',
      'mfrac',
      'mtext',
      'semantics',
      'annotation',
      'sub',
      'sup',
    ],
    ALLOWED_ATTR: [
      'class',
      'id',
      'href',
      'src',
      'alt',
      'title',
      'target',
      'width',
      'height',
      'viewBox',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'rx',
      'ry',
      'd',
      'style',
      'mathvariant',
      'encoding',
    ],
  })
})

function handleClick(e: MouseEvent): void {
  const link = (e.target as HTMLElement).closest('a[href^="#paper/"]') as HTMLAnchorElement | null
  if (link) {
    e.preventDefault()
    const paperId = link.getAttribute('href')?.replace('#paper/', '')
    if (paperId) {
      emit('paper-click', paperId)
    }
    return
  }

  const btn = (e.target as HTMLElement).closest('.code-block-copy') as HTMLElement | null
  if (!btn) return

  const wrapper = btn.closest('.code-block-wrapper')
  const codeEl = wrapper?.querySelector('pre code')
  const text = codeEl?.textContent ?? ''
  if (!text) return

  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.classList.add('is-copied')
      setTimeout(() => btn.classList.remove('is-copied'), 2000)
    })
    .catch(() => {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      btn.classList.add('is-copied')
      setTimeout(() => btn.classList.remove('is-copied'), 2000)
    })
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="markdown-content max-w-none wrap-break-word" @click="handleClick" v-html="html" />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
/* ---------- Base ---------- */
.markdown-content {
  overflow-wrap: anywhere;
  word-break: break-word;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--ppx-text-soft);
}

/* ---------- Headings ---------- */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  color: var(--ppx-text);
  letter-spacing: -0.01em;
}

.markdown-content :deep(h1) {
  font-size: 1.5rem;
  margin: 1.75rem 0 1rem;
  line-height: 1.25;
}

.markdown-content :deep(h2) {
  font-size: 1.25rem;
  margin: 1.5rem 0 0.75rem;
  line-height: 1.3;
}

.markdown-content :deep(h3) {
  font-size: 1.125rem;
  margin: 1.25rem 0 0.625rem;
  line-height: 1.35;
}

.markdown-content :deep(h4) {
  font-size: 1rem;
  margin: 1rem 0 0.5rem;
  line-height: 1.4;
}

.markdown-content :deep(h5) {
  font-size: 0.9375rem;
  margin: 0.875rem 0 0.5rem;
  line-height: 1.4;
}

.markdown-content :deep(h6) {
  font-size: 0.875rem;
  margin: 0.75rem 0 0.5rem;
  line-height: 1.4;
  color: var(--ppx-text-muted);
}

/* ---------- Paragraphs ---------- */
.markdown-content :deep(p) {
  margin-bottom: 0.75rem;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* ---------- Lists ---------- */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
}

.markdown-content :deep(li::marker) {
  color: var(--ppx-text-muted);
}

.markdown-content :deep(li > ul),
.markdown-content :deep(li > ol) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

/* ---------- Code blocks ---------- */
.markdown-content :deep(.code-block-wrapper) {
  border: 1px solid var(--ppx-border);
  border-radius: var(--ppx-radius-panel);
  overflow: hidden;
  margin: 1rem 0;
}

.markdown-content :deep(.code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.875rem;
  background: var(--ppx-bg-subtle);
  border-bottom: 1px solid var(--ppx-border);
}

.markdown-content :deep(.code-block-lang) {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ppx-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.markdown-content :deep(.code-block-copy) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--ppx-radius-interactive);
  border: 1px solid var(--ppx-border);
  background: var(--ppx-bg-elevated);
  color: var(--ppx-text-soft);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--ppx-motion-fast) var(--ppx-ease);
  user-select: none;
}

.markdown-content :deep(.code-block-copy:hover) {
  background: var(--ppx-bg);
  color: var(--ppx-text);
  border-color: var(--ppx-border-strong);
}

.markdown-content :deep(.code-block-copy .copied-label) {
  display: none;
}

.markdown-content :deep(.code-block-copy.is-copied) {
  color: var(--ppx-success);
  border-color: var(--ppx-success);
}

.markdown-content :deep(.code-block-copy.is-copied .copy-label) {
  display: none;
}

.markdown-content :deep(.code-block-copy.is-copied .copied-label) {
  display: inline;
}

.markdown-content :deep(pre) {
  background: var(--ppx-bg-elevated);
  color: var(--ppx-text);
  padding: 0.875rem 1.25rem;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.65;
  scrollbar-width: thin;
  scrollbar-color: var(--ppx-border-strong) transparent;
  margin: 0;
}

.markdown-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
  border: none;
  white-space: pre;
  word-break: normal;
}

.dark .markdown-content :deep(.code-block-wrapper) {
  border-color: rgba(148, 163, 184, 0.12);
}

.dark .markdown-content :deep(.code-block-header) {
  background: rgba(148, 163, 184, 0.06);
  border-bottom-color: rgba(148, 163, 184, 0.1);
}

.dark .markdown-content :deep(pre) {
  background: #0b1728;
}

/* ---------- Inline code ---------- */
.markdown-content :deep(code:not(pre code)) {
  background: var(--ppx-bg-subtle);
  color: var(--ppx-danger);
  padding: 0.15rem 0.375rem;
  border-radius: 0.375rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--ppx-border);
}

.dark .markdown-content :deep(code:not(pre code)) {
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.12);
  color: #fca5a5;
}

/* ---------- Blockquotes ---------- */
.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--ppx-border-strong);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--ppx-text-muted);
  font-style: italic;
}

.markdown-content :deep(blockquote p) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

/* ---------- Links ---------- */
.markdown-content :deep(a) {
  color: var(--ppx-accent);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
  opacity: 0.8;
}

/* ---------- Horizontal rule ---------- */
.markdown-content :deep(hr) {
  border: 0;
  border-top: 1px solid var(--ppx-border);
  margin: 1.5rem 0;
}

/* ---------- Tables ---------- */
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

.markdown-content :deep(th) {
  border-bottom: 1px solid var(--ppx-border-strong);
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--ppx-text);
}

.markdown-content :deep(td) {
  border-bottom: 1px solid var(--ppx-border);
  padding: 0.5rem 0.75rem;
  color: var(--ppx-text-soft);
}

.markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

/* ---------- Emphasis ---------- */
.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--ppx-text);
}

.markdown-content :deep(em) {
  font-style: italic;
}

/* ---------- Images ---------- */
.markdown-content :deep(img) {
  max-width: 100%;
  border-radius: var(--ppx-radius-panel);
  margin: 0.5rem 0;
}

/* ---------- Strikethrough ---------- */
.markdown-content :deep(del) {
  text-decoration: line-through;
  color: var(--ppx-text-muted);
}

/* ---------- Math ---------- */
.markdown-content :deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0;
  margin: 0.75rem 0;
}

.markdown-content :deep(.katex) {
  font-size: 1.05em;
}

/* ---------- Paper Links ---------- */
.markdown-content :deep(.paper-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  margin: 0.125rem 0;
  border: 1px solid var(--ppx-border);
  background: color-mix(in srgb, var(--ppx-bg-subtle) 84%, transparent);
  color: var(--ppx-text-soft);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition:
    transform var(--ppx-motion-fast) var(--ppx-ease-smooth),
    box-shadow var(--ppx-motion-fast) var(--ppx-ease-smooth),
    background-color var(--ppx-motion-fast) var(--ppx-ease),
    border-color var(--ppx-motion-fast) var(--ppx-ease);
}

.markdown-content :deep(.paper-link:hover) {
  transform: translateY(-1px);
  background: var(--ppx-bg-elevated);
  color: var(--ppx-text);
  border-color: var(--ppx-border-strong);
  text-decoration: none;
}
</style>
