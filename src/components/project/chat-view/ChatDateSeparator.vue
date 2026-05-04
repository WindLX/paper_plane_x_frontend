<script setup lang="ts">
const props = defineProps<{
  date: string
}>()
</script>

<template>
  <div class="flex items-center justify-center py-4">
    <div class="bg-ppx-border h-px flex-1"></div>
    <span class="text-ppx-text-soft mx-3 text-xs">
      {{ new Date(props.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}
    </span>
    <div class="bg-ppx-border h-px flex-1"></div>
  </div>
</template>
