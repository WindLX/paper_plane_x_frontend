<script setup lang="ts">
import DataProcessCard from '@/components/settings/DataProcessCard.vue'
import LibrarianCard from '@/components/settings/LibrarianCard.vue'
import MinerUCard from '@/components/settings/MinerUCard.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
</script>

<template>
  <section v-if="settingsStore.appSettings" class="animate-stagger grid gap-4 xl:grid-cols-2">
    <MinerUCard />
    <DataProcessCard />
    <LibrarianCard />
  </section>
</template>
