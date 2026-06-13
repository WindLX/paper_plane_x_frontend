<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    icon: Component
    label: string
    active?: boolean
    tone?: 'neutral' | 'rose'
  }>(),
  {
    active: false,
    tone: 'neutral',
  },
)

const emit = defineEmits<{
  click: []
}>()

const toneClass = computed(() => {
  if (props.tone === 'rose') {
    return 'border-ppx-border-strong bg-ppx-bg-elevated text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-3 focus-visible:ring-ppx-danger-soft'
  }
  return 'border-ppx-border bg-ppx-bg-elevated text-ppx-text-soft hover:bg-ppx-bg-subtle hover:text-ppx-text focus-visible:ring-3 focus-visible:ring-ppx-accent-soft'
})
</script>

<template>
  <button
    type="button"
    :title="props.label"
    :aria-label="props.label"
    class="project-topbar-button shadow-ppx-rest rounded-ppx-interactive inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap focus-visible:outline-none"
    :class="[toneClass, props.active ? 'bg-ppx-bg-subtle ring-ppx-border-strong ring-1' : '']"
    @click="emit('click')"
  >
    <component :is="props.icon" class="h-3.5 w-3.5 shrink-0" />
    <span class="project-topbar-button__label">{{ props.label }}</span>
  </button>
</template>

<style scoped>
@container ppx-topbar (max-width: 55.999rem) {
  .project-topbar-button {
    width: 2rem;
    padding-inline: 0;
    gap: 0;
  }

  .project-topbar-button__label {
    display: none;
  }
}
</style>
