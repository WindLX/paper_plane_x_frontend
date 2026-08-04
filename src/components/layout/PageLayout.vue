<script setup lang="ts">
import { computed } from 'vue'

import { useMediaQuery } from '@/composables/useMediaQuery'

import PageTopbar from './PageTopbar.vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    drawerOpen?: boolean
    drawerExpanded?: boolean
    drawerExpandedWidth?: number
    noPadding?: boolean
    fullWidth?: boolean
  }>(),
  {
    subtitle: '',
    drawerOpen: false,
    drawerExpanded: false,
    drawerExpandedWidth: 768,
    noPadding: false,
    fullWidth: false,
  },
)

const emit = defineEmits<{
  closeDrawer: []
}>()

const useFloatingDrawer = useMediaQuery('(max-width: 1750px)')

const drawerWidth = computed(() => {
  if (!props.drawerOpen) return '0px'
  if (!props.drawerExpanded) return 'min(100vw, var(--width-drawer))'
  return `min(100vw, calc(var(--width-drawer) + ${props.drawerExpandedWidth}px))`
})

const desktopDrawerClass = computed(() =>
  props.drawerOpen ? 'border-ppx-border/80 border-l' : 'border-l-0',
)
</script>

<template>
  <div class="flex h-full flex-1">
    <div class="flex min-w-0 flex-1 flex-col">
      <PageTopbar :title="props.title" :subtitle="props.subtitle">
        <template #actions><slot name="topbar-actions" /></template>
      </PageTopbar>
      <main
        id="app-main"
        class="min-w-0 flex-1 overflow-y-auto"
        :class="props.noPadding ? '' : 'px-4 py-6 lg:px-8'"
      >
        <div class="h-full w-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- Right drawer area  -->
    <div
      v-if="!useFloatingDrawer"
      class="shrink-0"
      :class="desktopDrawerClass"
      :style="{ width: drawerWidth }"
    >
      <slot name="drawer" />
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
          v-if="props.drawerOpen && useFloatingDrawer"
          class="fixed inset-0 z-55 bg-black/30"
          @click="emit('closeDrawer')"
        />
      </Transition>
      <Transition
        enter-active-class="duration-ppx-standard ease-ppx transition-all"
        enter-from-class="translate-x-6 opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="duration-ppx-fast ease-ppx transition-all"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-6 opacity-0"
      >
        <div
          v-if="props.drawerOpen && useFloatingDrawer"
          class="fixed inset-y-0 right-0 z-60 overflow-x-hidden"
          :style="{ width: drawerWidth }"
        >
          <slot name="drawer" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
