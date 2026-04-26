<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import LibrarianPanel from '../components/librarian/LibrarianPanel.vue'
import ProjectInfoPanel from '../components/project/ProjectInfoPanel.vue'
import OperationLogs from '../components/project/ProjectOperationLogs.vue'
import Export from '../components/project/ProjectExport.vue'
import { EMPTY_LIBRARIAN_GUIDE, useLibrarianGuide } from '../constants/librarianHelp'
import { useNotify } from '../composables/notify'
import { useProjectStore } from '../stores/projects'

const route = useRoute()
const projectStore = useProjectStore()
const notify = useNotify()
const projectId = computed(() => String(route.params.projectId ?? ''))
const { guide, ensureGuide } = useLibrarianGuide()

const project = computed(() =>
  projectStore.projects.find((item) => item.project_id === projectId.value),
)

const librarianHelp = computed(() => guide.value ?? EMPTY_LIBRARIAN_GUIDE)

onMounted(async () => {
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }
  try {
    await ensureGuide()
  } catch (error) {
    notify.push(error instanceof Error ? error.message : String(error), 'error', 3600)
  }
})
</script>

<template>
  <section class="space-y-6">
    <ProjectInfoPanel :project="project" :project-id="projectId" />

    <OperationLogs :project="project" />
    <Export :project-id="projectId" />

    <LibrarianPanel :project-id="projectId" :librarian-help="librarianHelp" />
  </section>
</template>
