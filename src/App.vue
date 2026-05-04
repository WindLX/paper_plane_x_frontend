<script setup lang="ts">
import { watch, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppDialog from './components/AppDialog.vue'
import AppNotify from './components/AppNotify.vue'
import AppRightDrawer from './components/drawer/AppRightDrawer.vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import AppTopbar from './components/topbar/AppTopbar.vue'
import { useUiStore } from './stores/ui'

const route = useRoute()
const uiStore = useUiStore()

watchEffect(() => {
  const classList = document.documentElement.classList
  if (uiStore.darkMode) {
    classList.add('dark')
  } else {
    classList.remove('dark')
  }
})

watch(
  () => route.fullPath,
  () => {
    uiStore.closeMobileSidebar()
    if (uiStore.rightDrawerOpen && uiStore.rightDrawerSource === 'local') {
      uiStore.closeRightDrawer()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="text-ppx-text h-screen overflow-hidden">
    <a
      href="#app-main"
      class="focus:bg-ppx-text focus:text-ppx-bg-elevated sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-70 focus:rounded-xl focus:px-4 focus:py-2 focus:text-sm"
    >
      Skip to main content
    </a>

    <div class="flex h-full">
      <div
        class="duration-ppx-standard ease-ppx hidden h-full shrink-0 overflow-hidden transition-[width] lg:block"
        :class="uiStore.desktopSidebarCollapsed ? 'w-19' : 'w-68'"
      >
        <AppSidebar :collapsed="uiStore.desktopSidebarCollapsed" />
      </div>

      <Transition name="shell-overlay">
        <div
          v-if="uiStore.mobileSidebarOpen"
          class="bg-ppx-text/25 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          @click="uiStore.closeMobileSidebar()"
        />
      </Transition>
      <Transition name="shell-sidebar">
        <div
          v-if="uiStore.mobileSidebarOpen"
          class="fixed inset-y-0 left-0 z-50 w-[min(88vw,20rem)] lg:hidden"
        >
          <AppSidebar mobile @close="uiStore.closeMobileSidebar()" />
        </div>
      </Transition>

      <div class="flex min-h-0 min-w-0 flex-1">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main
            id="app-main"
            class="min-h-0 min-w-0 flex-1 overflow-y-auto"
            :class="route.name === 'ProjectDetailPage' ? '' : 'px-4 py-6 lg:px-8'"
          >
            <div
              class="mx-auto h-full w-full"
              :class="route.name === 'ProjectDetailPage' ? '' : 'max-w-340'"
            >
              <RouterView v-slot="{ Component }">
                <Transition name="page" mode="out-in">
                  <component :is="Component" />
                </Transition>
              </RouterView>
            </div>
          </main>
        </div>

        <div
          class="duration-ppx-standard ease-ppx hidden h-full shrink-0 overflow-hidden transition-[width] xl:block"
          :class="
            uiStore.rightDrawerOpen
              ? 'border-ppx-border/80 bg-ppx-bg-elevated/70 w-xl border-l'
              : 'w-0'
          "
        />
      </div>
    </div>

    <AppRightDrawer />
    <AppDialog />
    <AppNotify />
  </div>
</template>
