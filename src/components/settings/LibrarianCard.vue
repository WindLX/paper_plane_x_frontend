<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
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
    :title="t('settings.appSettings.librarian.title')"
    :body="t('settings.appSettings.librarian.body')"
    :icon="BookOpen"
    :action-label="t('actions.save')"
    :loading="props.ctrl.saving"
    @action="props.ctrl.updateLibrarianConfig(props.ctrl.appSettings!.librarian)"
  >
    <div>
      <label class="workspace-label">{{ t('settings.appSettings.librarian.topTagsLimit') }}</label>
      <input
        v-model.number="props.ctrl.appSettings!.librarian.top_tags_limit"
        type="number"
        class="workspace-input"
      />
    </div>
  </SettingsCard>
</template>
