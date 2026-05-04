<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  cards: Array<{
    key: string
    label: string
    value: number
    color: string
    icon: Component
  }>
}>()
</script>

<template>
  <div class="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
    <div v-for="card in cards" :key="card.key" class="workspace-stat-card px-3.5 py-3">
      <div class="workspace-meta flex items-center gap-1.5">
        <component :is="card.icon" class="h-3.5 w-3.5" />
        <span>{{ card.label }}</span>
      </div>
      <div class="mt-1.5 text-2xl leading-none font-semibold tracking-tight" :class="card.color">
        {{ card.value }}
      </div>
    </div>
  </div>
</template>
