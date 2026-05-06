<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <teleport to="body">
    <Transition name="panel-pop-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-55 bg-black/10 backdrop-blur-[1px]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="panel-pop">
      <div
        v-if="open"
        class="bg-ppx-bg-elevated border-ppx-border rounded-ppx-page fixed top-16 right-4 z-60 flex max-h-[calc(100vh-5rem)] w-3xl max-w-[calc(100vw-2rem)] flex-col overflow-hidden border"
        @click.stop
      >
        <div class="border-ppx-border flex items-center justify-between border-b px-4 py-3">
          <h3 class="text-ppx-text text-sm font-semibold tracking-tight">{{ title }}</h3>
          <button type="button" class="workspace-icon-button" @click="emit('close')">
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <slot />
        </div>
      </div>
    </Transition>
  </teleport>
</template>
