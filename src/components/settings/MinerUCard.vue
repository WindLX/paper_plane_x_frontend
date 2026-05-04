<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settingsStore = useSettingsStore()
</script>

<template>
  <SettingsCard
    :title="t('settings.appSettings.mineru.title')"
    :body="t('settings.appSettings.mineru.body')"
    :icon="FileText"
    :action-label="t('actions.save')"
    :loading="settingsStore.saving"
    @action="settingsStore.updateMinerUConfig(settingsStore.appSettings!.mineru)"
  >
    <div>
      <label class="workspace-label">{{ t('settings.providers.baseUrl') }}</label>
      <input v-model="settingsStore.appSettings!.mineru.base_url" class="workspace-input" />
    </div>
    <div>
      <label class="workspace-label">{{ t('settings.appSettings.mineru.outputDir') }}</label>
      <input v-model="settingsStore.appSettings!.mineru.output_dir" class="workspace-input" />
    </div>
  </SettingsCard>
</template>
