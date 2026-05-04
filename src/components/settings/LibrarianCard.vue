<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settingsStore = useSettingsStore()
</script>

<template>
  <SettingsCard
    :title="t('settings.appSettings.librarian.title')"
    :body="t('settings.appSettings.librarian.body')"
    :icon="BookOpen"
    :action-label="t('actions.save')"
    :loading="settingsStore.saving"
    @action="settingsStore.updateLibrarianConfig(settingsStore.appSettings!.librarian)"
  >
    <div class="workspace-subpanel p-2.5">
      <label class="workspace-label">{{ t('settings.appSettings.librarian.topTagsLimit') }}</label>
      <input
        v-model.number="settingsStore.appSettings!.librarian.top_tags_limit"
        type="number"
        class="workspace-input"
      />
    </div>
  </SettingsCard>
</template>
