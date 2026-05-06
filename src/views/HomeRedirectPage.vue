<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Compass } from 'lucide-vue-next'

import { api } from '@/api'
import PageLayout from '@/components/layout/PageLayout.vue'

const router = useRouter()
const { t } = useI18n()

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
  <div class="h-full w-full">
    <PageLayout :title="t('redirect.title')" :subtitle="t('redirect.subtitle')">
      <section class="flex min-h-[80vh] items-center justify-center">
        <div class="workspace-page w-full max-w-xl p-7 text-center">
          <div
            class="workspace-subpanel text-ppx-accent mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center"
          >
            <Compass class="h-6 w-6" />
          </div>
          <h2 class="text-ppx-text text-2xl font-semibold tracking-tight">
            {{ t('redirect.description') }}
          </h2>
        </div>
      </section>
    </PageLayout>
  </div>
</template>
