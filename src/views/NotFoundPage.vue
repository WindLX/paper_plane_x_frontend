<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Compass } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppButton from '@/components/AppButton.vue'
import PageLayout from '@/components/layout/PageLayout.vue'

const { t } = useI18n()
const router = useRouter()
const navigating = ref(false)

async function goToLatestProject(): Promise<void> {
  if (navigating.value) return
  navigating.value = true
  try {
    const payload = await api.listProjects(0, 100, 'desc', 'updated_at')
    const firstProject = payload.items[0]
    if (firstProject) {
      await router.push(`/projects/${firstProject.project_id}`)
      return
    }
    await router.push('/library')
  } finally {
    navigating.value = false
  }
}
</script>

<template>
  <div class="h-full w-full">
    <PageLayout :title="t('notFound.title')" :subtitle="t('notFound.subtitle')">
      <section class="flex min-h-[80vh] items-center justify-center">
        <div class="workspace-page w-full max-w-xl p-7 text-center">
          <div
            class="workspace-subpanel text-ppx-accent mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center"
          >
            <Compass class="h-6 w-6" />
          </div>
          <h2 class="text-ppx-text text-2xl font-semibold tracking-tight">404</h2>
          <p class="text-ppx-text-soft mt-2 text-sm">
            {{ t('notFound.description') }}
          </p>
          <div class="mt-6 flex items-center justify-center gap-2">
            <AppButton
              tone="sky"
              variant="outline"
              size="sm"
              :loading="navigating"
              @click="goToLatestProject"
            >
              <ArrowLeft class="h-4 w-4" />
              <span>{{ t('notFound.backToProjects') }}</span>
            </AppButton>
          </div>
        </div>
      </section>
    </PageLayout>
  </div>
</template>
