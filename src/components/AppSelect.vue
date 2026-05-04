<script setup lang="ts" generic="T">
import { ChevronDown } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

interface SelectOption {
  label: string
  value: T
}

const modelValue = defineModel<T>()

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    placeholder: '-',
    disabled: false,
    size: 'md',
  },
)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const displayLabel = computed(() => {
  const found = props.options.find((o) => o.value === modelValue.value)
  return found?.label ?? props.placeholder
})

const sizeClass = computed(() =>
  props.size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3.5 py-2.5 text-sm',
)

function select(value: T) {
  modelValue.value = value
  open.value = false
}

function onClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onClickOutside, { capture: true })
  } else {
    document.removeEventListener('click', onClickOutside, { capture: true })
  }
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="workspace-select flex w-full items-center justify-between gap-2 text-left outline-none"
      :class="sizeClass"
      :disabled="disabled"
      @click="open = !open"
    >
      <span class="truncate">{{ displayLabel }}</span>
      <ChevronDown
        class="shrink-0 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
        :size="size === 'sm' ? 14 : 16"
      />
    </button>

    <Transition name="select-dropdown">
      <div
        v-if="open"
        class="border-ppx-border-strong bg-ppx-bg-elevated shadow-ppx-raised rounded-ppx-interactive absolute z-50 mt-1 max-h-60 w-full overflow-auto border py-1"
      >
        <button
          v-for="opt in options"
          :key="String(opt.value)"
          type="button"
          class="w-full cursor-pointer px-3.5 py-2 text-left text-sm transition-colors"
          :class="
            opt.value === modelValue
              ? 'bg-ppx-accent-soft/60 text-ppx-accent font-medium'
              : 'hover:bg-ppx-bg-subtle text-ppx-text'
          "
          @click="select(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s var(--ppx-ease-smooth);
}
.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
