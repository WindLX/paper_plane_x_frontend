<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  autoRefreshEnabled: boolean
  refreshing: boolean
  lastUpdatedAt: string | null
}>()

const emit = defineEmits<{
  toggleAutoRefresh: []
}>()

const { t } = useI18n()
</script>

<template>
  <teleport to="#app-topbar-page-actions-meta">
    <div class="text-ppx-text-muted text-xs">
      {{
        t('tasks.autoRefreshLastUpdated', {
          status: props.autoRefreshEnabled ? t('tasks.autoRefreshOn') : t('tasks.autoRefreshOff'),
          time: props.lastUpdatedAt ? formatDateTime(props.lastUpdatedAt) : '-',
        })
      }}
    </div>
  </teleport>

  <teleport to="#app-topbar-page-actions">
    <AppButton
      variant="outline"
      size="xs"
      :title="`${t('actions.refresh')}（双击切换自动刷新）`"
      @dblclick="emit('toggleAutoRefresh')"
    >
      <RefreshCw
        class="h-3.5 w-3.5"
        :class="props.refreshing || props.autoRefreshEnabled ? 'animate-spin' : ''"
      />
      <span>{{ props.autoRefreshEnabled ? t('tasks.autoRefreshOn') : t('actions.refresh') }}</span>
    </AppButton>
  </teleport>
</template>
