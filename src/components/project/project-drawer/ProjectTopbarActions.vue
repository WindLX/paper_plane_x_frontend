<script setup lang="ts">
import { LibraryBig, Download, Pencil, FileText, Trash2, Info } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'

defineProps<{
  activePanel: string | null
  hasConversation?: boolean
}>()

const emit = defineEmits<{
  openPanel: [name: string]
  deleteProject: []
  openConversation: []
}>()

const { t } = useI18n()

const buttons = [
  { key: 'overview', icon: LibraryBig, label: t('projects.overview') },
  { key: 'export', icon: Download, label: t('projects.export') },
  { key: 'edit', icon: Pencil, label: t('projects.edit') },
  { key: 'logs', icon: FileText, label: t('projects.viewLogs') },
] as const
</script>

<template>
  <div class="flex items-center gap-1.5">
    <AppButton
      v-for="btn in buttons"
      :key="btn.key"
      size="xs"
      variant="outline"
      :class="activePanel === btn.key ? 'bg-ppx-bg-subtle ring-ppx-border-strong ring-1' : ''"
      @click="emit('openPanel', btn.key)"
    >
      <component :is="btn.icon" class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ btn.label }}</span>
    </AppButton>

    <div class="bg-ppx-border h-5 w-px" />

    <AppButton size="xs" variant="outline" tone="rose" @click="emit('deleteProject')">
      <Trash2 class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ t('projects.delete') }}</span>
    </AppButton>

    <AppButton
      v-if="hasConversation"
      size="xs"
      variant="outline"
      @click="emit('openConversation')"
    >
      <Info class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ t('projects.chatDrawer.conversationTitle') }}</span>
    </AppButton>
  </div>
</template>
