<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import brandIcon from '@/assets/favicon.svg'
import { appConfig } from '@/config'

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="props.collapsed" class="flex items-center justify-center px-1">
    <button
      type="button"
      aria-label="Expand navigation"
      class="group duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors"
      @click="emit('toggleSidebar')"
    >
      <img
        :src="brandIcon"
        :alt="t('sidebar.appName')"
        class="duration-ppx-fast h-5 w-5 transition-opacity group-hover:opacity-0"
      />
      <PanelLeftOpen
        class="text-ppx-text-soft duration-ppx-fast pointer-events-none absolute h-4.5 w-4.5 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </button>
  </div>

  <div v-else class="flex items-center justify-between gap-1 px-1">
    <div class="flex min-w-0 items-center gap-2">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl">
        <img :src="brandIcon" :alt="t('sidebar.appName')" class="h-5 w-5" />
      </div>
      <div class="min-w-0">
        <div class="text-m text-ppx-text truncate font-semibold tracking-tight">
          {{ t('sidebar.appName') }}
        </div>
        <div class="workspace-muted text-xs">v{{ appConfig.appVersion }}</div>
      </div>
    </div>

    <button
      v-if="!props.collapsed"
      type="button"
      aria-label="Collapse navigation"
      class="workspace-icon-button inline-flex"
      @click="emit('toggleSidebar')"
    >
      <PanelLeftClose class="h-4 w-4" />
    </button>
  </div>
</template>
