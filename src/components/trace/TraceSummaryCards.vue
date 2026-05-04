<script setup lang="ts">
import { Activity, Bot, ListOrdered, TrendingUp, Layers } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AgentTraceStats } from '@/types/api'

const props = defineProps<{
  stats: AgentTraceStats | null
  total: number
}>()

const { t } = useI18n()

const agentEntries = computed(() => {
  if (!props.stats?.agent_name_counts) return []
  return Object.entries(props.stats.agent_name_counts).sort((a, b) => b[1] - a[1])
})

const AGENT_COLORS = [
  'text-emerald-700 dark:text-emerald-300',
  'text-amber-700 dark:text-amber-300',
  'text-rose-700 dark:text-rose-300',
  'text-violet-700 dark:text-violet-300',
  'text-cyan-700 dark:text-cyan-300',
  'text-orange-700 dark:text-orange-300',
]

const AGENT_ICONS = [Bot, TrendingUp, Layers, Activity, ListOrdered]

const cards = computed(() => {
  const list = [
    {
      key: 'total',
      label: t('traces.cards.total'),
      value: props.total,
      color: 'text-indigo-700 dark:text-indigo-300',
      icon: ListOrdered,
    },
    {
      key: 'agents',
      label: t('traces.cards.agents'),
      value: agentEntries.value.length,
      color: 'text-sky-700 dark:text-sky-300',
      icon: Activity,
    },
  ]

  agentEntries.value.forEach((entry, index) => {
    list.push({
      key: `agent-${entry[0]}`,
      label: entry[0],
      value: entry[1],
      color: AGENT_COLORS[index % AGENT_COLORS.length],
      icon: AGENT_ICONS[index % AGENT_ICONS.length],
    })
  })

  return list
})
</script>

<template>
  <div
    class="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
  >
    <div v-for="card in cards" :key="card.key" class="workspace-stat-card px-3.5 py-3">
      <div class="workspace-meta flex items-center gap-1.5 text-xs">
        <component :is="card.icon" class="h-3.5 w-3.5 opacity-80" />
        <span class="truncate">{{ card.label }}</span>
      </div>
      <div class="mt-1.5 text-2xl leading-none font-semibold tracking-tight" :class="card.color">
        {{ card.value }}
      </div>
    </div>
  </div>
</template>
