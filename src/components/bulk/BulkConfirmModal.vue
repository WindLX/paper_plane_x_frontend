<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import AppModalShell from '../AppModalShell.vue'

const PREVIEW_LIMIT = 8

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    items: string[]
    confirmLabel: string
    tone?: 'default' | 'danger'
    busy?: boolean
  }>(),
  {
    tone: 'default',
    busy: false,
  },
)

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const { t } = useI18n()

const preview = computed(() => props.items.slice(0, PREVIEW_LIMIT))
const hiddenCount = computed(() => Math.max(0, props.items.length - PREVIEW_LIMIT))
</script>

<template>
  <AppModalShell
    :open="props.open"
    :title="props.title"
    width-class="max-w-lg"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="workspace-body whitespace-pre-wrap">
        {{ props.message }}
      </p>

      <div v-if="props.items.length > 0" class="space-y-1.5">
        <div class="workspace-label">{{ t('bulk.confirm.impactedIds') }}</div>
        <ul class="workspace-subpanel max-h-48 space-y-1 overflow-y-auto p-2">
          <li v-for="id in preview" :key="id" class="workspace-code text-xs break-all">
            {{ id }}
          </li>
          <li v-if="hiddenCount > 0" class="text-ppx-text-muted text-xs">
            {{ t('bulk.confirm.more', { count: hiddenCount }) }}
          </li>
        </ul>
      </div>

      <div class="flex justify-end gap-2">
        <AppButton size="sm" variant="outline" :disabled="props.busy" @click="emit('close')">
          {{ t('dialog.cancel') }}
        </AppButton>
        <AppButton
          size="sm"
          :tone="props.tone === 'danger' ? 'rose' : 'sky'"
          variant="solid"
          :loading="props.busy"
          @click="emit('confirm')"
        >
          {{ props.confirmLabel }}
        </AppButton>
      </div>
    </div>
  </AppModalShell>
</template>
