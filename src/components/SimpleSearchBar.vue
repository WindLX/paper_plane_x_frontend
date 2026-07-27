<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    placeholder: string
    variant?: 'subtle' | 'elevated'
  }>(),
  {
    variant: 'elevated',
  },
)

const keyword = defineModel<string>({ required: true })
const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <label class="relative block">
    <Search
      class="text-ppx-text-muted pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
    />
    <input
      v-model="keyword"
      :placeholder="props.placeholder"
      :class="[
        'workspace-input w-full py-3 pr-4 pl-11',
        props.variant === 'subtle' ? 'bg-ppx-bg-subtle' : '',
      ]"
      @keydown.enter.prevent="emit('submit')"
    />
  </label>
</template>
