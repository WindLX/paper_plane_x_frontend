<script setup lang="ts">
import { Menu } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header
    class="border-ppx-border/80 bg-ppx-bg-elevated/95 sticky top-0 z-10 border-b backdrop-blur"
  >
    <div class="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Open navigation" class="workspace-icon-button lg:hidden">
          <Menu class="h-4 w-4" />
        </button>
        <div class="min-w-0">
          <h1 class="text-ppx-text truncate text-xl font-semibold tracking-tight">
            {{ props.title }}
          </h1>
          <p v-if="props.subtitle" class="text-ppx-text-muted mt-0.5 truncate text-xs">
            {{ props.subtitle }}
          </p>
          <div class="mt-1">
            <slot name="title-meta" />
          </div>
        </div>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <div id="app-topbar-page-actions" class="flex items-center gap-2">
          <slot name="actions" />
        </div>
        <div id="app-topbar-page-actions-meta">
          <slot name="actions-meta" />
        </div>
      </div>
    </div>
  </header>
</template>
