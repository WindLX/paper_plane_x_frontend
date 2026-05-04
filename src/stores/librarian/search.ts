import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLibrarianSearchStore = defineStore('librarian-search', () => {
  const searchProjectId = ref('')
  const searchPaperId = ref('')
  const searchQueryExpr = ref('')

  function clearSearch(): void {
    searchPaperId.value = ''
    searchQueryExpr.value = ''
  }

  function setSearchProjectId(projectId: string): void {
    searchProjectId.value = projectId
  }

  return {
    searchProjectId,
    searchPaperId,
    searchQueryExpr,
    clearSearch,
    setSearchProjectId,
  }
})
