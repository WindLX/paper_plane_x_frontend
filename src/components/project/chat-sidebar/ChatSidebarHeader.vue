<script setup lang="ts">
import { PanelLeftClose } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center justify-between gap-1 px-3 py-3">
    <div v-if="!props.collapsed" class="flex min-w-0 items-center gap-2">
      <span class="text-ppx-text text-sm font-semibold tracking-tight">
        {{ t('chat.sidebarTitle') }}
      </span>
    </div>
    <button
      type="button"
      class="workspace-icon-button"
      :title="t('chat.toggleSidebar')"
      @click="emit('toggle')"
    >
      <PanelLeftClose class="h-4 w-4" />
    </button>
  </div>
</template>
