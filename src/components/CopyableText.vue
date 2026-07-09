<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { useCopyable } from '@/composables/useCopyable'

const props = defineProps<{
  text: string
  mono?: boolean
}>()

const { t } = useI18n()

const copy = useCopyable()
</script>

<template>
  <button
    type="button"
    class="text-ppx-accent hover:bg-ppx-accent-soft hover:text-ppx-accent inline-flex w-fit min-w-0 cursor-pointer items-center gap-1 rounded-xl border border-transparent px-1.5 py-1 text-left decoration-dotted underline-offset-2"
    :class="props.mono ? 'font-mono text-xs' : 'text-sm'"
    :title="copy.copied ? t('copyable.copied') : t('copyable.clickToCopy')"
    @click="copy.copyToClipboard(props.text)"
  >
    <span class="break-all">{{ props.text }}</span>
    <Check v-if="copy.copied" class="h-3.5 w-3.5 shrink-0" />
    <Copy v-else class="h-3.5 w-3.5 shrink-0" />
  </button>
</template>
