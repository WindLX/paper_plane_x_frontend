<script setup lang="ts">
defineProps<{
  label: string
  placeholder?: string
  multiline?: boolean
  rows?: number
}>()

const modelValue = defineModel<string>({ default: '' })
</script>

<template>
  <label class="block">
    <span class="workspace-label">{{ label }}</span>
    <textarea
      v-if="multiline"
      v-model="modelValue"
      :rows="rows ?? 4"
      :placeholder="placeholder"
      class="workspace-textarea"
    />
    <input
      v-else
      v-model="modelValue"
      type="text"
      :placeholder="placeholder"
      class="workspace-input"
    />
  </label>
</template>
