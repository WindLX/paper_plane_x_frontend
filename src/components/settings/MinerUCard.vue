<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
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
    :title="t('settings.appSettings.mineru.title')"
    :body="t('settings.appSettings.mineru.body')"
    :icon="FileText"
    :action-label="t('settings.appSettings.save')"
    :loading="props.ctrl.saving"
    @action="props.ctrl.updateMinerUConfig(props.ctrl.appSettings!.mineru)"
  >
    <div>
      <label class="workspace-label">{{ t('settings.providers.baseUrl') }}</label>
      <input v-model="props.ctrl.appSettings!.mineru.base_url" class="workspace-input" />
    </div>
    <div>
      <label class="workspace-label">{{ t('settings.appSettings.mineru.outputDir') }}</label>
      <input v-model="props.ctrl.appSettings!.mineru.output_dir" class="workspace-input" />
    </div>
  </SettingsCard>
</template>
