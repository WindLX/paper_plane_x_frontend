<script setup lang="ts">
import { computed } from 'vue'
import { Menu } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useUiStore } from '@/stores/ui'

const route = useRoute()
const { t } = useI18n()
const uiStore = useUiStore()

const routeKey = computed(() => {
  const name = typeof route.name === 'string' ? route.name : ''
  const map: Record<string, string> = {
    ProjectDetailPage: 'routes.projectDetail',
    LibraryPage: 'routes.library',
    TasksPage: 'routes.tasks',
    TracesPage: 'routes.traces',
    SettingsPage: 'routes.settings',
    NotFoundPage: 'routes.notFound',
  }
  return map[name] ?? 'routes.console'
})

const subtitleKey = computed(() => {
  const name = typeof route.name === 'string' ? route.name : ''
  const map: Record<string, string> = {
    ProjectDetailPage: 'shell.subtitles.projectDetail',
    LibraryPage: 'shell.subtitles.library',
    TasksPage: 'shell.subtitles.tasks',
    TracesPage: 'shell.subtitles.traces',
    SettingsPage: 'shell.subtitles.settings',
    NotFoundPage: 'shell.subtitles.notFound',
  }
  return map[name] ?? 'shell.subtitles.default'
})

const isProjectDetail = computed(() => route.name === 'ProjectDetailPage')

const displayTitle = computed(() => {
  if (isProjectDetail.value && uiStore.pageTitle) {
    return uiStore.pageTitle
  }
  return t(routeKey.value)
})

const displaySubtitle = computed(() => {
  if (isProjectDetail.value && uiStore.pageSubtitle) {
    return uiStore.pageSubtitle
  }
  if (isProjectDetail.value) {
    return ''
  }
  return t(subtitleKey.value)
})
</script>

<template>
  <header
    class="border-ppx-border/80 bg-ppx-bg-elevated/95 sticky top-0 z-10 border-b backdrop-blur"
  >
    <div class="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          class="workspace-icon-button lg:hidden"
          @click="uiStore.openMobileSidebar()"
        >
          <Menu class="h-4 w-4" />
        </button>
        <div class="min-w-0">
          <h1 class="text-ppx-text truncate text-xl font-semibold tracking-tight">
            {{ displayTitle }}
          </h1>
          <p v-if="displaySubtitle" class="text-ppx-text-muted mt-0.5 truncate text-xs">
            {{ displaySubtitle }}
          </p>
          <div id="app-topbar-page-meta" class="mt-1" />
        </div>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <div id="app-topbar-page-actions" class="flex items-center gap-2" />
        <div id="app-topbar-page-actions-meta" />
      </div>
    </div>
  </header>
</template>

<style scoped>
#app-topbar-page-actions:empty + .app-topbar-actions-divider {
  display: none;
}
</style>
