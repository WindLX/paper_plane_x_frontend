<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title: string
    description?: string
    widthClass?: string
  }>(),
  {
    open: true,
    description: '',
    widthClass: 'max-w-5xl',
  },
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <teleport to="body">
    <Transition
      enter-active-class="transition-all duration-ppx-standard ease-ppx"
      leave-active-class="transition-all duration-ppx-standard ease-ppx"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-xs"
        @click="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-ppx-standard ease-ppx-emphasis"
          leave-active-class="transition-all duration-ppx-standard ease-ppx-emphasis"
          enter-from-class="opacity-0 scale-[0.96]"
          leave-to-class="opacity-0 scale-[0.96]"
        >
          <div
            v-if="props.open"
            class="modal-surface workspace-page relative flex max-h-[90vh] w-full flex-col overflow-hidden border shadow-[0_24px_64px_-28px_rgba(15,23,42,0.42)]"
            :class="props.widthClass"
            @click.stop
          >
            <header
              class="workspace-divider relative flex items-start justify-between gap-4 border-b px-4 py-3"
            >
              <div class="space-y-1">
                <h3 class="workspace-section-title text-lg leading-6">
                  {{ props.title }}
                </h3>
                <p v-if="props.description" class="workspace-body">
                  {{ props.description }}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                class="workspace-icon-button bg-ppx-bg-elevated/70"
                @click="emit('close')"
              >
                <X class="h-4 w-4" />
              </button>
            </header>
            <div class="min-h-0 flex-1 overflow-auto px-4 py-3.5">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </teleport>
</template>

<style scoped>
.modal-surface {
  border-color: color-mix(in srgb, var(--ppx-border-strong) 88%, transparent);
  background: var(--ppx-bg);
}
</style>
