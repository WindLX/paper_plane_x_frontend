<script setup lang="ts">
import { Cog, Pencil, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import type { LLMProvider } from '@/types/api'

const props = defineProps<{
  providers: LLMProvider[]
  loading: boolean
}>()

const emit = defineEmits<{
  add: []
  edit: [provider: LLMProvider]
  delete: [provider: LLMProvider]
}>()

const { t } = useI18n()
</script>

<template>
  <SettingsCard
    :title="t('settings.providers.title')"
    :icon="Cog"
    :action-label="t('settings.providers.add')"
    :loading="loading"
    @action="emit('add')"
  >
    <div class="workspace-table-shell">
      <table class="workspace-table">
        <thead>
          <tr>
            <th>{{ t('settings.providers.name') }}</th>
            <th>{{ t('settings.providers.model') }}</th>
            <th>{{ t('settings.providers.baseUrl') }}</th>
            <th class="text-right">{{ t('settings.providers.edit') }}</th>
          </tr>
        </thead>
        <tbody class="animate-stagger">
          <tr
            v-for="p in props.providers"
            :key="p.name"
            class="workspace-row-hover transition-colors"
          >
            <td class="text-ppx-text font-medium">{{ p.name }}</td>
            <td>{{ p.model }}</td>
            <td>{{ p.base_url || '-' }}</td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-1">
                <AppButton size="xs" variant="outline" @click="emit('edit', p)">
                  <Pencil class="h-3.5 w-3.5" />
                </AppButton>
                <AppButton size="xs" variant="outline" tone="rose" @click="emit('delete', p)">
                  <Trash2 class="h-3.5 w-3.5" />
                </AppButton>
              </div>
            </td>
          </tr>
          <tr v-if="props.providers.length === 0">
            <td colspan="4" class="workspace-table-empty text-center">
              {{ t('settings.providers.noProviders') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </SettingsCard>
</template>
