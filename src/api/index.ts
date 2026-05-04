import { conversationApi } from './conversation'
import { hitlApi } from './hitl'
import { papersApi } from './papers'
import { projectsApi } from './projects'
import { settingsApi } from './settings'
import { tasksApi } from './tasks'
import { tracesApi } from './traces'
import { librarianApi } from './librarian'

export const api = {
  ...papersApi,
  ...projectsApi,
  ...settingsApi,
  ...tasksApi,
  ...tracesApi,
  ...librarianApi,
  ...conversationApi,
  ...hitlApi,
}
