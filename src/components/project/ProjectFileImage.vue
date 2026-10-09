<script setup lang="ts">
import { ImageOff } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  path: string
  name: string
  url: string
}>()

const { t } = useI18n()
const failed = ref(false)
watch(
  () => props.url,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <figure class="m-0 flex min-h-0 flex-col items-center gap-3">
    <img
      v-if="!failed"
      :src="props.url"
      :alt="props.name"
      class="border-ppx-border rounded-ppx-panel max-h-full max-w-full border object-contain"
      @error="failed = true"
    />
    <div
      v-else
      role="alert"
      class="workspace-badge--danger rounded-ppx-interactive flex items-center gap-2 px-3 py-2 text-sm"
    >
      <ImageOff class="h-4 w-4 shrink-0" />
      <span class="wrap-anywhere">{{ t('projectFiles.imageLoadFailed') }}: {{ props.path }}</span>
    </div>
    <figcaption class="workspace-label mb-0">{{ props.path }}</figcaption>
  </figure>
</template>
