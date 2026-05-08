<script setup lang="ts">
import { PanelRightClose } from 'lucide-vue-next'

defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="bg-ppx-bg-elevated flex h-full min-w-0 flex-col overflow-x-hidden">
    <header class="workspace-divider flex items-start justify-between gap-3 border-b px-4 py-4">
      <div class="min-w-0">
        <div class="text-ppx-text mt-1 text-lg font-semibold tracking-tight">
          {{ $props.title ?? '' }}
        </div>
        <div class="mt-1">
          <slot name="header-meta" />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <slot name="header-actions" />
        <button
          type="button"
          aria-label="Close drawer"
          class="workspace-icon-button"
          @click="emit('close')"
        >
          <PanelRightClose class="h-4 w-4" />
        </button>
      </div>
    </header>

    <div class="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
      <slot />
    </div>
  </div>
</template>
