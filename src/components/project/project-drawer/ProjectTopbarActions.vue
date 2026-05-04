<script setup lang="ts">
import { LibraryBig, Download, Pencil, FileText, Trash2, Info } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import { useConversationStore } from '@/stores/conversation'
import { useUiStore } from '@/stores/ui'

defineProps<{
  activePanel: string | null
}>()

const emit = defineEmits<{
  openPanel: [name: string]
  deleteProject: []
}>()

const { t } = useI18n()
const chatStore = useConversationStore()
const uiStore = useUiStore()

const buttons = [
  { key: 'overview', icon: LibraryBig, label: t('projectDetail.overview') },
  { key: 'export', icon: Download, label: t('projectDetail.export') },
  { key: 'edit', icon: Pencil, label: t('projectDetail.edit') },
  { key: 'logs', icon: FileText, label: t('projectDetail.viewLogs') },
] as const

function openConversationDrawer(): void {
  const conversationId = chatStore.currentConversationId
  if (!conversationId) return
  uiStore.openRightDrawer('conversation', { conversationId }, 'local')
}
</script>

<template>
  <teleport to="#app-topbar-page-actions">
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
        <span class="hidden sm:inline">{{ t('projectDetail.delete') }}</span>
      </AppButton>

      <AppButton
        v-if="chatStore.currentConversationId"
        size="xs"
        variant="outline"
        @click="openConversationDrawer"
      >
        <Info class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ t('drawer.conversationTitle') }}</span>
      </AppButton>
    </div>
  </teleport>
</template>
