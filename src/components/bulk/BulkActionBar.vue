<script setup lang="ts">
import { LoaderCircle, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'

const props = withDefaults(
  defineProps<{
    count: number
    busy?: boolean
  }>(),
  {
    busy: false,
  },
)

const emit = defineEmits<{
  clear: []
}>()

const { t } = useI18n()
</script>

<!--
  Selection toolbar that lives in the table header actions slot. It only
  renders the selected count, the caller's action buttons and the clear control,
  so an empty selection never reserves header space.
-->
<template>
  <div class="flex shrink-0 items-center justify-end gap-2">
    <span class="workspace-badge workspace-badge--info shrink-0 whitespace-nowrap">
      {{ t('bulk.selectedCount', { count: props.count }) }}
    </span>
    <span
      v-if="props.busy"
      class="text-ppx-text-muted inline-flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap"
    >
      <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
      {{ t('bulk.running') }}
    </span>
    <slot />
    <AppButton
      icon-only
      size="xs"
      variant="outline"
      :disabled="props.busy"
      :title="t('bulk.clearSelection')"
      :aria-label="t('bulk.clearSelection')"
      @click="emit('clear')"
    >
      <X class="h-3.5 w-3.5" />
    </AppButton>
  </div>
</template>
