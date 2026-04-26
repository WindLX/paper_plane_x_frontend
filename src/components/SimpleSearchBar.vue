<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const props = defineProps<{
    placeholder: string
}>();
const keyword = defineModel<string>({ required: true });
</script>

<template>

    <div
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search class="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <input v-model="keyword" :placeholder="props.placeholder"
            class="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
    </div>
</template>