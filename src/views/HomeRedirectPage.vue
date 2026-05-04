<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api'

const router = useRouter()

onMounted(async () => {
  try {
    const payload = await api.listProjects(0, 100, 'desc', 'updated_at')
    const firstProject = payload.items[0]
    if (firstProject) {
      await router.replace(`/projects/${firstProject.project_id}`)
      return
    }
  } catch {
    // If project bootstrap fails, fall back to library entry.
  }
  await router.replace('/library')
})
</script>

<template>
  <section class="workspace-page text-ppx-text-soft p-5 text-sm">Redirecting...</section>
</template>
