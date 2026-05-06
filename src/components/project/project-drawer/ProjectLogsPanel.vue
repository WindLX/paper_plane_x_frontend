<script setup lang="ts">
import { computed } from 'vue'
import { Clock3 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import JsonPanel from '@/components/JsonPanel.vue'
import type { ProjectResponse } from '@/types/api'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  project: ProjectResponse
}>()

const { t } = useI18n()

function readScalar(log: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = log[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return null
}

const logEntries = computed(() =>
  props.project.operation_logs.map((log, index) => {
    const title =
      readScalar(log, ['operation', 'action', 'event', 'type', 'name']) ??
      t('projects.logTitle', { index: index + 1 })
    const timestamp = readScalar(log, ['created_at', 'updated_at', 'timestamp', 'time'])
    const status = readScalar(log, ['status', 'level', 'result'])
    const summary = readScalar(log, ['message', 'summary', 'detail', 'description'])
    const metadata = Object.entries(log)
      .filter(([key, value]) => {
        if (['operation', 'action', 'event', 'type', 'name', 'created_at', 'updated_at', 'timestamp', 'time', 'status', 'level', 'result', 'message', 'summary', 'detail', 'description'].includes(key)) {
          return false
        }
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      })
      .slice(0, 6)
    return { log, index, title, timestamp, status, summary, metadata }
  }),
)
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="project.operation_logs.length === 0"
      class="workspace-subpanel text-ppx-text-soft rounded-xl p-4 text-sm"
    >
      {{ t('projects.noOperationLogs') }}
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="entry in logEntries"
        :key="entry.index"
        class="workspace-panel space-y-3 rounded-2xl p-3.5"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 space-y-1">
            <div class="text-ppx-text text-sm font-semibold">{{ entry.title }}</div>
            <p v-if="entry.summary" class="text-ppx-text-soft text-xs leading-5">
              {{ entry.summary }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="entry.status"
              class="workspace-badge workspace-badge--neutral px-2 py-0.5 text-xs uppercase"
            >
              {{ entry.status }}
            </span>
            <span
              v-if="entry.timestamp"
              class="workspace-badge workspace-badge--neutral inline-flex items-center gap-1 px-2 py-0.5 text-xs"
            >
              <Clock3 class="h-3 w-3" />
              {{ formatDateTime(entry.timestamp) }}
            </span>
          </div>
        </div>

        <div v-if="entry.metadata.length" class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="[key, value] in entry.metadata"
            :key="`${entry.index}-${key}`"
            class="workspace-subpanel space-y-1 rounded-xl p-2.5"
          >
            <div class="workspace-label mb-0">{{ key }}</div>
            <div class="text-ppx-text text-sm break-all">{{ value }}</div>
          </div>
        </div>

        <div class="workspace-subpanel rounded-xl p-2.5">
          <JsonPanel :title="t('projects.rawResponse')" :value="entry.log" :default-open="false" />
        </div>
      </div>
    </div>
  </div>
</template>
