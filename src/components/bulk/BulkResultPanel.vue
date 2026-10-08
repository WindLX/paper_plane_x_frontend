<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BulkDisplayRow, BulkItemStatus, BulkSkipCode } from '@/utils/bulkRunner'
import AppButton from '../AppButton.vue'
import CopyableText from '../CopyableText.vue'

const props = withDefaults(
  defineProps<{
    rows: BulkDisplayRow[]
    title?: string
  }>(),
  {
    title: undefined,
  },
)

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const counts = computed(() => ({
  success: props.rows.filter((row) => row.status === 'success').length,
  failed: props.rows.filter((row) => row.status === 'failed').length,
  skipped: props.rows.filter((row) => row.status === 'skipped').length,
}))

const SKIP_REASON_KEYS: Record<BulkSkipCode, string> = {
  missing: 'bulk.results.reasons.missing',
  'already-linked': 'bulk.results.reasons.alreadyLinked',
  'not-linked': 'bulk.results.reasons.notLinked',
  'status-mismatch': 'bulk.results.reasons.statusMismatch',
}

function statusLabel(status: BulkItemStatus): string {
  return t('bulk.results.' + status)
}

function statusClass(status: BulkItemStatus): string {
  if (status === 'success') return 'workspace-badge--success'
  if (status === 'failed') return 'workspace-badge--danger'
  return 'workspace-badge--neutral'
}

function detail(row: BulkDisplayRow): string | null {
  const parts: string[] = []
  if (row.reason?.kind === 'ineligible') {
    parts.push(t(SKIP_REASON_KEYS[row.reason.code]))
  } else if (row.reason?.kind === 'error') {
    parts.push(row.reason.message)
  }
  if (row.extra) parts.push(row.extra)
  return parts.length > 0 ? parts.join(' · ') : null
}
</script>

<template>
  <section class="workspace-panel animate-fade-in-up space-y-3 p-3.5">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div class="space-y-1">
        <h4 class="workspace-heading-card">{{ props.title ?? t('bulk.results.title') }}</h4>
        <p class="workspace-body text-xs">
          {{ t('bulk.results.summary', counts) }}
        </p>
      </div>
      <AppButton size="xs" variant="outline" @click="emit('close')">
        {{ t('bulk.results.close') }}
      </AppButton>
    </header>

    <div v-if="props.rows.length === 0" class="workspace-body text-sm">
      {{ t('bulk.results.empty') }}
    </div>

    <ul v-else class="max-h-64 space-y-1.5 overflow-y-auto">
      <li
        v-for="row in props.rows"
        :key="row.id"
        class="workspace-panel-inset flex flex-wrap items-center gap-2 px-2.5 py-2"
      >
        <CopyableText :text="row.id" mono />
        <span class="workspace-badge" :class="statusClass(row.status)">
          {{ statusLabel(row.status) }}
        </span>
        <span v-if="detail(row)" class="text-ppx-text-muted text-xs wrap-break-word">
          {{ detail(row) }}
        </span>
      </li>
    </ul>
  </section>
</template>
