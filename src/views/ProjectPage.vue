<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import PageLayout from '@/components/layout/PageLayout.vue'
import SlidePanel from '@/components/layout/SlidePanel.vue'
import ChatDrawerContent from '@/components/project/chat-drawer/ChatDrawerContent.vue'
import FileDrawerContent from '@/components/project/file-drawer/FileDrawerContent.vue'
import PaperDrawerContent from '@/components/project/paper-drawer/PapersDrawerContent.vue'
import ProjectChatSidebar from '@/components/project/ProjectChatSidebar.vue'
import ProjectChatView from '@/components/project/ProjectChatView.vue'
import ProjectFileView from '@/components/project/ProjectFileView.vue'
import ProjectPaperView from '@/components/project/ProjectPaperView.vue'
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
      :drawer-open="ctrl.drawerOpen"
      no-padding
      @close-drawer="ctrl.closeDrawer"
    >
      <template #topbar-actions>
        <ProjectTopbarDrawer
          :project="ctrl.project"
          :global-finder="ctrl.globalFinder"
          :loading="ctrl.loading"
          :has-conversation="ctrl.hasCurrentConversation"
          :active-tab="ctrl.activeTab"
          @update:agent-summary="ctrl.updateAgentSummary"
          @delete:agent-summary="ctrl.deleteAgentSummary"
          @force-agent-summary="ctrl.forceAgentSummary"
          @update:project="ctrl.updateProject"
          @delete:project="ctrl.openDeleteConfirm"
          @export:project="ctrl.exportProject"
          @open-tab="ctrl.openTab"
        />
      </template>

      <section class="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <template v-if="ctrl.activeTab === 'conversations'">
          <ProjectChatSidebar
            :conversations="ctrl.conversations.conversations"
            :active-conversation-id="ctrl.conversations.activeConversationId"
            :loading="ctrl.conversations.loading"
            :collapsed="!ctrl.conversations.sidebarOpen"
            :mobile="ctrl.conversations.isMobile"
            :open="ctrl.conversations.sidebarOpen"
            @select="ctrl.conversations.selectConversation"
            @create="ctrl.handleCreateConversation"
            @toggle="ctrl.conversations.toggleSidebar"
          />

          <ProjectChatView
            :project-id="props.projectId"
            :scroll-to-turn-id="ctrl.conversationDrawer.scrollToTurnId"
            @toggle-sidebar="ctrl.conversations.toggleSidebar"
            @open-details="ctrl.conversationDrawer.toggleDrawer"
            @open-paper="ctrl.conversationDrawer.openDrawerPaper"
          />
        </template>
        <template v-else-if="ctrl.activeTab === 'files'">
          <ProjectFileView
            :project-id="props.projectId"
            @toggle-drawer="ctrl.toggleFileDrawer"
            @open-drawer="ctrl.openFileDrawer"
          />
        </template>
        <template v-else-if="ctrl.activeTab === 'papers'">
          <ProjectPaperView :project-id="props.projectId" @open-drawer="ctrl.openPaperDrawer" />
        </template>
      </section>

      <template #drawer>
        <SlidePanel
          :title="
            ctrl.activeTab === 'conversations'
              ? t('projects.chatDrawer.conversationTitle')
              : t('projects.chatDrawer.tabPapers')
          "
          @close="ctrl.closeDrawer"
        >
          <ChatDrawerContent
            v-if="
              ctrl.conversationDrawer.drawerData.conversation && ctrl.activeTab === 'conversations'
            "
            :conversation="ctrl.conversationDrawer.drawerData.conversation"
            :turns="ctrl.conversationDrawer.drawerData.turns"
            :traces="ctrl.conversationDrawer.drawerData.traces"
            :selected-paper-id="ctrl.conversationDrawer.selectedPaperId"
            :selected-paper-nonce="ctrl.conversationDrawer.selectedPaperNonce"
            @scroll-to-turn="ctrl.conversationDrawer.handleScrollToTurn"
          />
          <FileDrawerContent
            v-else-if="ctrl.activeTab === 'files'"
            :project-id="props.projectId"
            :initial-paper-id="ctrl.fileDrawerPaperId"
          />
          <PaperDrawerContent
            v-else-if="ctrl.activeTab === 'papers'"
            :project-id="props.projectId"
            :initial-paper-id="ctrl.paperDrawerPaperId"
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
