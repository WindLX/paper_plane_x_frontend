<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import ChatDrawerContent from '@/components/project/chat-drawer/ChatDrawerContent.vue'
import ProjectChatSidebar from '@/components/project/ProjectChatSidebar.vue'
import ProjectChatView from '@/components/project/ProjectChatView.vue'
import ProjectDeleteConfirmModal from '@/components/project/ProjectDeleteConfirmModal.vue'
import ProjectTopbarDrawer from '@/components/project/ProjectTopbarDrawer.vue'
import { useProjectPageController } from '@/composables/useProjectPageController'

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const ctrl = useProjectPageController(toRef(props, 'projectId'))
</script>

<template>
  <div class="h-full w-full">
    <PageLayout
      :title="ctrl.pageTitle"
      :subtitle="ctrl.pageSubtitle"
      :drawer-open="ctrl.conversationDrawer.drawerOpen"
      no-padding
    >
      <template #topbar-actions>
        <ProjectTopbarDrawer
          :project="ctrl.project"
          :global-finder="ctrl.globalFinder"
          :loading="ctrl.loading"
          :has-conversation="ctrl.hasCurrentConversation"
          @update:agent-summary="ctrl.updateAgentSummary"
          @delete:agent-summary="ctrl.deleteAgentSummary"
          @force-agent-summary="ctrl.forceAgentSummary"
          @update:project="ctrl.updateProject"
          @delete:project="ctrl.openDeleteConfirm"
          @export:project="ctrl.exportProject"
          @open-conversation="ctrl.conversationDrawer.openDrawer"
        />
      </template>

      <section class="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <ProjectChatSidebar
          :conversations="ctrl.conversations.conversations"
          :active-conversation-id="ctrl.conversations.activeConversationId"
          :loading="ctrl.conversations.loading"
          :collapsed="!ctrl.conversations.sidebarOpen"
          @select="ctrl.conversations.selectConversation"
          @create="ctrl.handleCreateConversation"
          @toggle="ctrl.conversations.sidebarOpen = !ctrl.conversations.sidebarOpen"
        />

        <ProjectChatView
          :project-id="props.projectId"
          :scroll-to-turn-id="ctrl.conversationDrawer.scrollToTurnId"
          @toggle-sidebar="ctrl.conversations.sidebarOpen = !ctrl.conversations.sidebarOpen"
          @open-paper="ctrl.conversationDrawer.openDrawerPaper"
        />
      </section>

      <template #drawer>
        <SlidePanel
          :title="t('projects.chatDrawer.conversationTitle')"
          @close="ctrl.conversationDrawer.closeDrawer"
        >
          <ChatDrawerContent
            v-if="ctrl.conversationDrawer.drawerData.conversation"
            :conversation="ctrl.conversationDrawer.drawerData.conversation"
            :turns="ctrl.conversationDrawer.drawerData.turns"
            :traces="ctrl.conversationDrawer.drawerData.traces"
            :selected-paper-id="ctrl.conversationDrawer.selectedPaperId"
            :selected-paper-nonce="ctrl.conversationDrawer.selectedPaperNonce"
            @scroll-to-turn="ctrl.conversationDrawer.handleScrollToTurn"
          />
        </SlidePanel>
      </template>
    </PageLayout>

    <ProjectDeleteConfirmModal
      :open="ctrl.deleteConfirmOpen"
      :project-name="ctrl.project?.name ?? props.projectId"
      :project-id="props.projectId"
      :paper-count="ctrl.globalFinder?.stats?.paper_count ?? 0"
      :conversation-count="ctrl.project?.conversation_count ?? 0"
      @close="ctrl.closeDeleteConfirm"
      @confirm="ctrl.confirmDeleteProject"
    />
  </div>
</template>
