<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

const props = defineProps<{
  text: string
  mono?: boolean
}>()

const copied = ref(false)
let timer: number | null = null

async function copyText(): Promise<void> {
  await navigator.clipboard.writeText(props.text)
  copied.value = true
  if (timer !== null) {
    window.clearTimeout(timer)
  }
  timer = window.setTimeout(() => {
    copied.value = false
    timer = null
  }, 1200)
}
</script>

<template>
  <button type="button"
    class="inline-flex min-w-0 items-center gap-1 text-left text-sky-700 underline decoration-dotted underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200 cursor-pointer"
    :class="mono ? 'font-mono text-xs' : 'text-sm'" :title="copied ? 'Copied' : 'Click to copy'" @click="copyText">
    <span class="break-all">{{ text }}</span>
    <Check v-if="copied" class="h-3.5 w-3.5 shrink-0" />
    <Copy v-else class="h-3.5 w-3.5 shrink-0" />
  </button>
</template>
