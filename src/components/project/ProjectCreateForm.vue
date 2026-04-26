<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'

const props = defineProps<{
    onCreate: (name: string, description: string | null) => Promise<void>
}>()

const { t } = useI18n()
const name = ref('')
const description = ref('')
const submitting = ref(false)

async function submit(): Promise<void> {
    if (!name.value.trim()) return
    submitting.value = true
    try {
        await props.onCreate(name.value.trim(), description.value.trim() || null)
        name.value = ''
        description.value = ''
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <form
        class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-6"
        @submit.prevent="submit">
        <input v-model="name" :placeholder="t('projects.namePlaceholder')"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-slate-600 dark:bg-slate-950 md:col-span-2" />
        <input v-model="description" :placeholder="t('projects.descriptionPlaceholder')"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-slate-600 dark:bg-slate-950 md:col-span-3" />
        <AppButton type="submit" :disabled="submitting" tone="sky" variant="solid" size="md">
            <Plus class="h-4 w-4" />
            <span>{{ t('actions.create') }}</span>
        </AppButton>
    </form>
</template>
