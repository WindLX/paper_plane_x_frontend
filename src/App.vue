<script setup lang="ts">
import { onMounted, watch, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppDialog from './components/AppDialog.vue'
import AppNotify from './components/AppNotify.vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import { useHitlWsStore } from './stores/hitlWs'
import { useUiStore } from './stores/ui'

const uiStore = useUiStore()
const hitlWsStore = useHitlWsStore()
const route = useRoute()

watchEffect(() => {
  const classList = document.documentElement.classList
  if (uiStore.darkMode) {
    classList.add('dark')
  } else {
    classList.remove('dark')
  }
})

onMounted(() => {
  hitlWsStore.connect()
})

watch(
  () => route.fullPath,
  () => {
    uiStore.closeMobileSidebar()
  },
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
      <!-- Desktop sidebar -->
      <div
        class="duration-ppx-standard ease-ppx hidden h-full shrink-0 overflow-hidden transition-[width] lg:block"
        :class="uiStore.sidebarCollapsed ? 'w-15' : 'w-60'"
      >
        <AppSidebar :collapsed="uiStore.sidebarCollapsed" />
      </div>

      <!-- RouterView owns the full remaining area -->
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="duration-ppx-standard ease-ppx transition-opacity"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-ppx-fast ease-ppx transition-opacity"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="uiStore.mobileSidebarOpen"
          class="fixed inset-0 z-60 bg-black/35 lg:hidden"
          @click="uiStore.closeMobileSidebar()"
        />
      </Transition>
      <Transition
        enter-active-class="duration-ppx-standard ease-ppx transition-all"
        enter-from-class="-translate-x-6 opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="duration-ppx-fast ease-ppx transition-all"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="-translate-x-6 opacity-0"
      >
        <div
          v-if="uiStore.mobileSidebarOpen"
          class="fixed inset-y-0 left-0 z-70 w-[min(18rem,calc(100vw-1.25rem))] max-w-full lg:hidden"
        >
          <AppSidebar :collapsed="false" />
        </div>
      </Transition>
    </Teleport>

    <AppDialog />
    <AppNotify />
  </div>
</template>
