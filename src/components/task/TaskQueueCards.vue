<script setup lang="ts">
import {
    Ban,
    CircleCheckBig,
    Clock3,
    ListOrdered,
    Timer,
    XCircle,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    total: number
    queued: number
    running: number
    completed: number
    failed: number
    canceled: number
}>()

const { t } = useI18n()

const cards = computed(() => [
    { label: t('tasks.cards.total'), value: props.total, color: 'text-indigo-700 dark:text-indigo-300', icon: ListOrdered },
    { label: t('tasks.cards.queued'), value: props.queued, color: 'text-sky-700 dark:text-sky-300', icon: Clock3 },
    { label: t('tasks.cards.running'), value: props.running, color: 'text-amber-700 dark:text-amber-300', icon: Timer },
    { label: t('tasks.cards.completed'), value: props.completed, color: 'text-emerald-700 dark:text-emerald-300', icon: CircleCheckBig },
    { label: t('tasks.cards.failed'), value: props.failed, color: 'text-rose-700 dark:text-rose-300', icon: XCircle },
    { label: t('tasks.cards.canceled'), value: props.canceled, color: 'text-slate-700 dark:text-slate-300', icon: Ban },
])
</script>

<template>
    <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div v-for="card in cards" :key="card.label"
            class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div class="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <component :is="card.icon" class="h-3.5 w-3.5" />
                <span>{{ card.label }}</span>
            </div>
            <div class="mt-2 text-2xl font-semibold" :class="card.color">{{ card.value }}</div>
        </div>
    </div>
</template>
