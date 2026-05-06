<script setup lang="ts">
import { Workflow } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import SettingsCard from '@/components/settings/SettingsCard.vue'
import type { SettingsController } from '@/composables/useSettingsController'

const { t } = useI18n()
const props = defineProps<{
  ctrl: SettingsController
}>()
</script>

<template>
  <SettingsCard
    :title="t('settings.appSettings.dataProcess.title')"
    :body="t('settings.appSettings.dataProcess.body')"
    :icon="Workflow"
    :action-label="t('actions.save')"
    :loading="props.ctrl.saving"
    @action="props.ctrl.updateDataProcessConfig(props.ctrl.appSettings!.data_process)"
  >
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="workspace-label">{{
          t('settings.appSettings.dataProcess.workerCount')
        }}</label>
        <input
          v-model.number="props.ctrl.appSettings!.data_process.worker_count"
          type="number"
          class="workspace-input"
        />
      </div>
      <div>
        <label class="workspace-label">{{
          t('settings.appSettings.dataProcess.maxRetries')
        }}</label>
        <input
          v-model.number="props.ctrl.appSettings!.data_process.max_retries"
          type="number"
          class="workspace-input"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="workspace-label">{{
          t('settings.appSettings.dataProcess.shutdownTimeout')
        }}</label>
        <input
          v-model.number="props.ctrl.appSettings!.data_process.shutdown_timeout"
          type="number"
          step="0.1"
          class="workspace-input"
        />
      </div>
      <div>
        <label class="workspace-label">{{
          t('settings.appSettings.dataProcess.taskMaxSeconds')
        }}</label>
        <input
          v-model.number="props.ctrl.appSettings!.data_process.task_max_seconds"
          type="number"
          step="0.1"
          class="workspace-input"
        />
      </div>
    </div>
  </SettingsCard>
</template>
