<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    color?: string
  }>(),
  {
    color: 'text-ppx-text-soft',
  },
)
</script>

<template>
  <span class="animate-pulse-dots" :class="props.color">
    <span />
    <span />
    <span />
  </span>
</template>
