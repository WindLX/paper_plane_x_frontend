<script setup lang="ts">
import PageTopbar from './PageTopbar.vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    drawerOpen?: boolean
    noPadding?: boolean
    fullWidth?: boolean
  }>(),
  {
    subtitle: '',
    drawerOpen: false,
    noPadding: false,
    fullWidth: false,
  },
)
</script>

<template>
  <div class="flex h-full flex-1">
    <div class="flex flex-1 flex-col">
      <PageTopbar :title="props.title" :subtitle="props.subtitle">
        <template #actions><slot name="topbar-actions" /></template>
        <template #actions-meta><slot name="topbar-actions-meta" /></template>
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
      class="duration-ppx-standard ease-ppx shrink-0 overflow-hidden transition-all"
      :class="props.drawerOpen ? 'border-ppx-border/80 w-xl border-l' : 'w-0 border-l-0'"
    >
      <slot name="drawer" />
    </div>
  </div>
</template>
