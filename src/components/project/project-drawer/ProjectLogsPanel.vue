<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import JsonPanel from '@/components/JsonPanel.vue'
import type { ProjectResponse } from '@/types/api'

defineProps<{
  project: ProjectResponse
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-3">
    <div v-if="project.operation_logs.length === 0" class="text-ppx-text-soft text-sm">
      {{ t('projectDetail.noOperationLogs') }}
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="(log, index) in project.operation_logs"
        :key="index"
        class="workspace-panel-inset rounded-xl p-2.5"
      >
        <div class="flex items-center justify-between">
          <span class="text-ppx-text text-xs font-semibold">
            {{ t('projectDetail.logTitle', { index: index + 1 }) }}
          </span>
        </div>
        <JsonPanel :title="''" :value="log" />
      </div>
    </div>
  </div>
</template>
