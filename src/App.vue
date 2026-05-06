<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { RouterView } from 'vue-router'

import AppDialog from './components/AppDialog.vue'
import AppNotify from './components/AppNotify.vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import { useHitlWsStore } from './stores/hitlWs'
import { useUiStore } from './stores/ui'

const uiStore = useUiStore()
const hitlWsStore = useHitlWsStore()

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

    <AppDialog />
    <AppNotify />
  </div>
</template>
