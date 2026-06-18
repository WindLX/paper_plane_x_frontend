<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { useNotify } from '@/composables/useNotify'

const props = defineProps<{
  text: string
  mono?: boolean
}>()

const { t } = useI18n()
const { push: notifyPush } = useNotify()
const copied = ref(false)
let timer: number | null = null

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  var ok
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

async function copyText(): Promise<void> {
  try {
    // navigator.clipboard is only available in secure contexts (HTTPS/localhost);
    // fall back to execCommand('copy') when serving over plain HTTP.
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.text)
    } else if (!legacyCopy(props.text)) {
      throw new Error('legacy copy failed')
    }
    copied.value = true
    if (timer !== null) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      copied.value = false
      timer = null
    }, 1200)
  } catch {
    notifyPush(t('copyable.copyFailed'), 'warning')
  }
}
</script>

<template>
  <button
    type="button"
    class="text-ppx-accent hover:bg-ppx-accent-soft hover:text-ppx-accent inline-flex w-fit min-w-0 cursor-pointer items-center gap-1 rounded-xl border border-transparent px-1.5 py-1 text-left decoration-dotted underline-offset-2"
    :class="mono ? 'font-mono text-xs' : 'text-sm'"
    :title="copied ? t('copyable.copied') : t('copyable.clickToCopy')"
    @click="copyText"
  >
    <span class="break-all">{{ text }}</span>
    <Check v-if="copied" class="h-3.5 w-3.5 shrink-0" />
    <Copy v-else class="h-3.5 w-3.5 shrink-0" />
  </button>
</template>
